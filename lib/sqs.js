'use strict';

const md5 = require('md5');
const uuid = require('uuid').v4;

const { assertQueue } = require('./utils/validations');
const { ErrorWithCode } = require('./utils/errors');
const messageAttributesMD5Checksum = require('./utils/message-attributes-md5-checksum');

const QUEUE_ARN = 'arn:aws:sqs:us-east-1:queues:';
const QUEUE_URL_REGEX = /http:\/\/localhost:\d+\/queues\//g;

const CONTENT_DEDUPLICATION_INTERVAL_5_MIN = 5 * 60 * 1000;

const queues = new Map();

function validateQueueName(queueName, isFifo) {
  if ((isFifo && !queueName.endsWith('.fifo')) || (!isFifo && queueName.endsWith('.fifo'))) {
    throw new ErrorWithCode(
      'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.',
      'InvalidParameterValue'
    );
  }
}

function validateDeadLetterQueue(deadLetterQueueArn, isFifo) {
  let foundArn;

  queues.forEach((value) => {
    if (value.Attributes.QueueArn === deadLetterQueueArn) {
      foundArn = deadLetterQueueArn;
      if (value.Attributes.FifoQueue !== isFifo) {
        throw new ErrorWithCode(
          `Value {&quot;deadLetterTargetArn&quot;:&quot;${deadLetterQueueArn}&quot;,&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Dead-letter target owner should be same as the source.`,
          'InvalidParameterValue'
        );
      }
    }
  });
  if (!foundArn) {
    throw new ErrorWithCode(
      `Value {&quot;deadLetterTargetArn&quot;:&quot;${deadLetterQueueArn}&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.`,
      'InvalidParameterValue'
    );
  }
}

function validateNoContentBasedDeduplication(contentBasedDeduplication) {
  if (contentBasedDeduplication) {
    throw new ErrorWithCode('Unknown Attribute ContentBasedDeduplication.', 'InvalidAttributeName');
  }
}

function queueAlreadyExists(queueName, attributes) {
  const queueWithSameName = queues.get(queueName);
  if (queueWithSameName) {
    const compareAttributes = [
      'ContentBasedDeduplication',
      'DelaySeconds',
      'KmsDataKeyReusePeriodSeconds',
      'KmsMasterKeyId',
      'MaximumMessageSize',
      'MessageRetentionPeriod',
      'ReceiveMessageWaitTimeSeconds',
      'VisibilityTimeout'
    ];

    if (attributes && attributes.RedrivePolicy && queueWithSameName.Attributes.RedrivePolicy) {
      if (
        queueWithSameName.Attributes.RedrivePolicy.deadLetterTargetArn !==
          attributes.RedrivePolicy.deadLetterTargetArn ||
        queueWithSameName.Attributes.RedrivePolicy.maxReceiveCount !==
          attributes.RedrivePolicy.maxReceiveCount
      ) {
        throw new ErrorWithCode(
          `A queue already exists with the same name and a different value for attribute RedrivePolicy`,
          'QueueAlreadyExists'
        );
      }
    }

    const wrongAttr = compareAttributes.find(
      (attr) =>
        queueWithSameName.Attributes[attr] &&
        attributes[attr] &&
        queueWithSameName.Attributes[attr] !== attributes[attr]
    );
    if (wrongAttr) {
      throw new ErrorWithCode(
        `A queue already exists with the same name and a different value for attribute ${wrongAttr}`,
        'QueueAlreadyExists'
      );
    }
  }
}

function clearQueues() {
  queues.clear();
}

function getQueueState(QueueUrl) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');

  return queues.get(convertedQueue);
}

// TODO: consider returning full queue state from this file and have separate file that formats it for the actions. State needs to be tested
function createQueue(params, host) {
  const queueParams = assertQueue(params);

  const { Attributes, QueueName, tags = {} } = queueParams;

  const {
    ContentBasedDeduplication,
    DelaySeconds,
    FifoQueue,
    KmsDataKeyReusePeriodSeconds,
    KmsMasterKeyId,
    MaximumMessageSize,
    MessageRetentionPeriod,
    ReceiveMessageWaitTimeSeconds,
    RedrivePolicy,
    VisibilityTimeout
  } = Attributes;

  const { deadLetterTargetArn } = RedrivePolicy || {};

  if (!FifoQueue) {
    validateNoContentBasedDeduplication(ContentBasedDeduplication);
  }

  validateQueueName(QueueName, FifoQueue);

  if (RedrivePolicy) {
    validateDeadLetterQueue(deadLetterTargetArn, FifoQueue);
  }

  queueAlreadyExists(QueueName, Attributes);
  const queueUrl = `http://${host}/queues/${QueueName}`;
  const queueArn = `${QUEUE_ARN}${QueueName}`;
  queues.set(QueueName, {
    '@State': {},
    Attributes: {
      ContentBasedDeduplication,
      CreatedTimestamp: Date.now(),
      DelaySeconds,
      FifoQueue,
      KmsDataKeyReusePeriodSeconds,
      KmsMasterKeyId,
      MaximumMessageSize,
      MessageRetentionPeriod,
      QueueArn: queueArn,
      ReceiveMessageWaitTimeSeconds,
      RedrivePolicy,
      VisibilityTimeout
    },
    messages: [],
    tags
  });

  return queueUrl;
}

function sendMessage(params) {
  const {
    MessageAttributes,
    MessageBody,
    MessageDeduplicationId = false,
    MessageGroupId,
    MessageSystemAttributes,
    QueueUrl
  } = params;

  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');

  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }

  const { Attributes } = queue;
  const { ContentBasedDeduplication, FifoQueue } = Attributes;

  if (FifoQueue && !MessageGroupId) {
    throw new ErrorWithCode(
      'The request must contain the parameter MessageGroupId.',
      'MissingParameter'
    );
  }

  const MessageId = uuid();
  const { DelaySeconds = null } = FifoQueue ? Attributes : params;

  const SentTimestamp = Date.now();
  let AvailableSince = SentTimestamp;

  if (ContentBasedDeduplication) {
    const duplicate = queue.messages.find(
      (message) =>
        !message['@State'].isRead &&
        (message.MessageDeduplicationId === MessageDeduplicationId ||
          (!message.MessageDeduplicationId && message.MessageBody === MessageBody))
    );
    if (duplicate) {
      AvailableSince = SentTimestamp + CONTENT_DEDUPLICATION_INTERVAL_5_MIN;
    }
  }

  const message = {
    '@State': { isRead: false },
    Attributes: {
      ApproximateFirstReceiveTimestamp: '',
      ApproximateReceiveCount: 0,
      AvailableSince,
      SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
      SentTimestamp
    },
    MessageBody, // TODO: assert for all valid message variations
    MessageId,
    ...(MessageAttributes && { MessageAttributes }),
    ...(MessageDeduplicationId && {
      MessageDeduplicationId,
      SequenceNumber: '00000000000000000000'
    }), // TODO: The length of SequenceNumber is 128 bits, continues to increase for a particular MessageGroupId. Implement seq number,
    ...(DelaySeconds && { DelaySeconds }),
    ...(MessageSystemAttributes && { MessageSystemAttributes }),
    MessageGroupId
  };

  const encodedMessage = {
    MD5OfMessageBody: md5(MessageBody),
    MessageId,
    ...(MessageAttributes && { MD5OfMessageAttributes: md5(MessageAttributes) }),
    ...(MessageDeduplicationId && {
      MessageDeduplicationId,
      SequenceNumber: '00000000000000000000'
    }),
    ...(DelaySeconds && { DelaySeconds }),
    ...(MessageSystemAttributes && { MD5OfMessageSystemAttributes: md5(MessageSystemAttributes) })
  };

  queue.messages.push(message);
  return encodedMessage;
}
// TODO: duplicates arriving together in the batch
function sendMessageBatch(params) {
  const { QueueUrl, messages } = params;

  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }

  const { Attributes } = queue;
  const { ContentBasedDeduplication } = Attributes;

  const result = [];
  const SentTimestamp = Date.now();
  let AvailableSince = SentTimestamp;

  for (const message of messages) {
    const {
      DelaySeconds,
      Id,
      MessageAttributes,
      MessageBody,
      MessageDeduplicationId = false,
      MessageGroupId
    } = message;

    // TODO: check if indeed auto generated
    const MessageId = uuid();
    if (ContentBasedDeduplication) {
      const duplicate = queue.messages.find(
        (msg) =>
          !msg['@State'].isRead &&
          (msg.MessageDeduplicationId === MessageDeduplicationId ||
            (!msg.MessageDeduplicationId && msg.MessageBody === MessageBody))
      );
      if (duplicate) {
        AvailableSince = SentTimestamp + CONTENT_DEDUPLICATION_INTERVAL_5_MIN;
      }
    }

    queue.messages.push({
      '@State': { isRead: false },
      Attributes: {
        ApproximateFirstReceiveTimestamp: '',
        ApproximateReceiveCount: 0,
        AvailableSince,
        SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
        SentTimestamp
      },
      Id,
      MessageAttributes,
      MessageBody,
      ...(MessageDeduplicationId && { MessageDeduplicationId }),
      MessageGroupId,
      MessageId,
      ...(DelaySeconds && { DelaySeconds })
    });

    result.push({
      Id: md5(Id),
      MDOfMessageBody: md5(MessageBody),
      MessageId,
      ...(MessageAttributes && {
        MD5OfMessageAttributes: messageAttributesMD5Checksum(MessageAttributes)
      })
    });
  }

  return result;
}

function listQueues() {
  const list = [];
  const iterator = queues.keys();

  for (let i = 0; i < queues.size; i++) {
    list.push(iterator.next().value);
  }
  return list;
}

function receiveMessage({
  AttributeNames,
  MaxNumberOfMessages = 1,
  MessageAttributeNames,
  QueueUrl,
  VisibilityTimeout
}) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }

  const stateParams = VisibilityTimeout ? { VisibilityTimeout, isRead: true } : { isRead: true };
  const ReceiptHandle = uuid(); // TODO: make unique ReceiptHandle for every message

  let messages = [];
  let remainingMessages = [];

  if (queue.Attributes.FifoQueue) {
    let firstMessageGroupId;

    for (let i = 0; i < queue.messages.length; i += 1) {
      if (queue.messages[i]['@State'].isRead === false) {
        firstMessageGroupId = queue.messages[i].MessageGroupId;
        break;
      }
    }

    const messageTest = {};

    let count = 0;
    for (let i = 0; i < queue.messages.length; i += 1) {
      if (count >= MaxNumberOfMessages) break;
      const msg = queue.messages[i];

      if (
        msg['@State'].isRead === false &&
        msg.MessageGroupId === firstMessageGroupId &&
        msg.Attributes.AvailableSince - Date.now() <= 0 // TODO: this is in case of deduplication, turn into function
      ) {
        const updatedMessage = {
          ...msg,
          '@State': {
            ...msg['@State'],
            ...stateParams,
            ReceiptHandle
          },
          Attributes: {
            ...msg.Attributes,
            ApproximateFirstReceiveTimestamp: Date.now(), // TODO: might need to update only on 1st read
            ApproximateReceiveCount: msg.Attributes.ApproximateReceiveCount + 1
          }
        };
        messageTest[i] = updatedMessage;
        messages.push(updatedMessage);
        count += 1;
      }
    }

    const keys = Object.keys(messageTest);
    for (let j = 0; j < keys.length; j += 1) {
      const index = keys[j];
      queue.messages[index] = messageTest[index];
    }
  } else {
    const unreadMessages = queue.messages.filter((msg) => !msg['@State'].isRead);
    const readMessages = queue.messages.filter((msg) => msg['@State'].isRead);
    messages = unreadMessages.slice(0, MaxNumberOfMessages).map((msg) => ({
      ...msg,
      '@State': {
        ...msg['@State'],
        ...stateParams,
        ReceiptHandle
      },
      Attributes: {
        ...msg.Attributes,
        ApproximateFirstReceiveTimestamp: Date.now(), // TODO: might need to update only on 1st read
        ApproximateReceiveCount: msg.Attributes.ApproximateReceiveCount + 1
      }
    }));
    remainingMessages = unreadMessages.slice(MaxNumberOfMessages);
    queue.messages = [...readMessages, ...messages, ...remainingMessages];
  }
  return messages.map(({ Attributes, MessageAttributes, MessageBody, MessageId }) => ({
    Body: MessageBody,
    MD5OfBody: md5(MessageBody),
    MessageId,
    ReceiptHandle,
    ...(AttributeNames && {
      Attributes: AttributeNames.includes('All')
        ? Attributes
        : AttributeNames.reduce((acc, item) => {
            const value = Attributes[item];
            if (value === undefined) return acc;
            return { ...acc, [item]: value };
          }, {})
    }),
    ...(MessageAttributeNames &&
      MessageAttributeNames.length > 0 && {
        MD5OfMessageAttributes: md5(MessageAttributeNames.join(',')),
        MessageAttributes: MessageAttributeNames.includes('All')
          ? MessageAttributes
          : MessageAttributeNames.reduce((acc, item) => {
              const value = MessageAttributes[item];
              if (value === undefined) return acc;
              return { ...acc, [item]: value };
            }, {})
      })
  }));
}

function deleteMessage({ QueueUrl, ReceiptHandle }) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }

  queue.messages = queue.messages.filter((msg) => msg['@State'].ReceiptHandle !== ReceiptHandle);
}

function deleteMessageBatch(QueueUrl, Entries) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }

  const entriesList = new Set(Entries.map(({ ReceiptHandle }) => ReceiptHandle));
  const entriesIds = Entries.map(({ Id }) => Id);

  // TODO: ensure the ids returned are only those that were deleted
  queue.messages = queue.messages.filter((msg) => entriesList.has(msg['@State'].ReceiptHandle));
  return entriesIds;
}

function deleteQueue({ QueueUrl }) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }
  queues.delete(convertedQueue);
}

function tagQueue(QueueUrl, tags) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);
  queue.tags = { ...queue.tags, ...tags };
}

function listQueueTags(QueueUrl) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);
  return queue.tags;
}

function untagQueue(QueueUrl, removeTags) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  for (const tag of removeTags) {
    if (queue.tags[tag]) delete queue.tags[tag];
  }
}

function setQueueAttributes(QueueUrl, Attributes) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }

  const { ContentBasedDeduplication, FifoQueue = false, RedrivePolicy } = Attributes;
  const { deadLetterTargetArn } = RedrivePolicy || {};

  if (!FifoQueue) {
    validateNoContentBasedDeduplication(ContentBasedDeduplication);
  }
  validateQueueName(convertedQueue, FifoQueue);

  if (RedrivePolicy) {
    validateDeadLetterQueue(deadLetterTargetArn, FifoQueue);
  }
  queue.Attributes = { ...queue.Attributes, ...Attributes };
}

function getQueueAttributes(QueueUrl, Attributes) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }
  const response = {
    ...queue.Attributes,
    ApproximateNumberOfMessages: queue.messages.length,
    RedrivePolicy: JSON.stringify(queue.Attributes.RedrivePolicy)
  };

  if (!Attributes.includes('All')) {
    for (const attr of Object.keys(response)) {
      if (!Attributes.includes(attr)) delete response[attr];
    }
  }

  const attributes = Object.keys(response);
  for (let i = 0; i < attributes.length; i += 1) {
    if (response[attributes[i]] === undefined) delete response[attributes[i]];
  }

  return response;

  // TODO: ApproximateNumberOfMessagesDelayed
  // TODO: ApproximateNumberOfMessagesNotVisible
  // TODO: Policy
}

function getQueueUrl(QueueName, host) {
  if (!queues.get(QueueName)) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }
  return `http://${host}/queues/${QueueName}`;
}

function purgeQueue(QueueUrl) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }
  queue.messages = [];
}

function listDeadLetterSourceQueues(QueueUrl, host) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'The specified queue does not exist for this wsdl version.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }

  const result = [];
  const iterator = queues.values();
  for (let i = 0; i < queues.size; i += 1) {
    const {
      Attributes: { QueueArn, RedrivePolicy }
    } = iterator.next().value;
    if (RedrivePolicy && RedrivePolicy.deadLetterTargetArn === `${QUEUE_ARN}${convertedQueue}`) {
      const name = QueueArn.replace(QUEUE_ARN, '');
      const url = `http://${host}/queues/${name}`;
      result.push(url);
    }
  }
  return result;
}

function changeMessageVisibility({ QueueUrl, ReceiptHandle, VisibilityTimeout }) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'The specified queue does not exist for this wsdl version.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }
  if (VisibilityTimeout > 43200 || VisibilityTimeout < 0) {
    throw new ErrorWithCode(
      `An error occurred (InvalidParameterValue) when calling the ChangeMessageVisibility operation: Value ${VisibilityTimeout} for parameter VisibilityTimeout is invalid. Reason: VisibilityTimeout must be an integer between 0 and 43200`,
      'ClientError'
    );
  }
  queue.messages = queue.messages.map((msg) => {
    const updatedMessage = JSON.parse(JSON.stringify(msg));
    if (updatedMessage['@State'].ReceiptHandle === ReceiptHandle) {
      updatedMessage['@State'].VisibilityTimeout = VisibilityTimeout;
    }
    return updatedMessage;
  });
}

module.exports = {
  changeMessageVisibility,
  clearQueues,
  createQueue,
  deleteMessage,
  deleteMessageBatch,
  deleteQueue,
  getQueueAttributes,
  getQueueState,
  getQueueUrl,
  listDeadLetterSourceQueues,
  listQueueTags,
  listQueues,
  purgeQueue,
  receiveMessage,
  sendMessage,
  sendMessageBatch,
  setQueueAttributes,
  tagQueue,
  untagQueue
};
