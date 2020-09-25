'use strict';

const md5 = require('md5');
const uuid = require('uuid').v4;
const { assertQueue } = require('./utils/validations');
const { ErrorWithCode } = require('./utils/errors');

const QUEUE_ARN = 'arn:aws:sqs:us-east-1:queues:';

const queues = new Map();

function validateQueueName(queueName, isFifo) {
  if (isFifo && !queueName.endsWith('.fifo')) {
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
  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');

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
    MessageDeduplicationId,
    MessageGroupId,
    MessageSystemAttributes,
    QueueUrl
  } = params;

  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');

  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }
  // TODO: make actual delay work for DelaySeconds

  const { Attributes } = queue;
  const { ContentBasedDeduplication, FifoQueue } = Attributes;

  if (FifoQueue && !MessageGroupId) {
    throw new ErrorWithCode(
      'The request must contain the parameter MessageGroupId.',
      'MissingParameter'
    );
  }

  if (FifoQueue && !ContentBasedDeduplication && !MessageDeduplicationId) {
    throw new ErrorWithCode(
      'The queue should either have ContentBasedDeduplication enabled or MessageDeduplicationId provided explicitly',
      'InvalidParameterValue'
    );
  }

  const MessageId = uuid();
  const { DelaySeconds = null } = FifoQueue ? Attributes : params;

  const message = {
    '@State': { isRead: false },
    Attributes: {
      ApproximateFirstReceiveTimestamp: '',
      ApproximateReceiveCount: 0,
      SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
      SentTimestamp: Date.now()
    },
    MessageBody, // TODO: assert for all valid message variations
    MessageId,
    ...(MessageAttributes && { MessageAttributes }),
    ...(MessageDeduplicationId && { SequenceNumber: '00000000000000000000' }), // TODO: The length of SequenceNumber is 128 bits, continues to increase for a particular MessageGroupId. Implement seq number,
    ...(DelaySeconds && { DelaySeconds }),
    ...(MessageSystemAttributes && { MessageSystemAttributes })
  };

  const encodedMessage = {
    MD5OfMessageBody: md5(MessageBody),
    MessageId,
    ...(MessageAttributes && { MD5OfMessageAttributes: md5(MessageAttributes) }),
    ...(MessageDeduplicationId && { SequenceNumber: '00000000000000000000' }),
    ...(DelaySeconds && { DelaySeconds }),
    ...(MessageSystemAttributes && { MD5OfMessageSystemAttributes: md5(MessageSystemAttributes) })
  };

  queue.messages.push(message);
  return encodedMessage;
}

function sendMessageBatch(params) {
  const { QueueUrl, messages } = params;

  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }

  const result = [];
  messages.forEach((message) => {
    const { DelaySeconds, Id, /* MessageAttributes, */ MessageBody } = message;

    // TODO: check if indeed auto generated
    const MessageId = uuid();

    queue.messages.push({
      '@State': { isRead: false },
      Attributes: {
        ApproximateFirstReceiveTimestamp: '',
        ApproximateReceiveCount: 0,
        SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
        SentTimestamp: Date.now()
      },
      Id,
      // MessageAttributes,
      MessageBody,
      MessageId,
      ...(DelaySeconds && { DelaySeconds })
    });

    result.push({
      Id: md5(Id),
      MDOfMessageBody: md5(MessageBody),
      MessageId
      // ...(MessageAttributes && { MD5OfMessageAttributes: md5(MessageAttributes) })
    });
  });

  return result;
}

function listQueues() {
  const list = [];
  queues.forEach((value, key) => list.push(key));
  return list;
}

function receiveMessage({
  AttributeNames,
  MaxNumberOfMessages = 1,
  MessageAttributeNames,
  QueueUrl,
  VisibilityTimeout
}) {
  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }

  // if (WaitTimeSeconds) {
  //   // TODO: amount of time can wait for messages
  // }

  const stateParams = VisibilityTimeout ? { VisibilityTimeout, isRead: true } : { isRead: true };
  const ReceiptHandle = uuid();
  const messages = queue.messages.slice(0, MaxNumberOfMessages).map((msg) => ({
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

  const remainingMessages = queue.messages.slice(MaxNumberOfMessages);
  queue.messages = [...messages, ...remainingMessages];

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
  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }

  queue.messages = queue.messages.filter((msg) => msg['@State'].ReceiptHandle !== ReceiptHandle);
}

function deleteQueue({ QueueUrl }) {
  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');
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
  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');
  const queue = queues.get(convertedQueue);
  queue.tags = { ...queue.tags, ...tags };
}

function listQueueTags(QueueUrl) {
  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');
  const queue = queues.get(convertedQueue);
  return queue.tags;
}

function untagQueue(QueueUrl, removeTags) {
  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');
  const queue = queues.get(convertedQueue);
  removeTags.forEach((tag) => {
    if (queue.tags[tag]) delete queue.tags[tag];
  });
}

function setQueueAttributes(QueueUrl, Attributes) {
  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');
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
  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');
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
    Object.keys(response).forEach((attr) => {
      if (!Attributes.includes(attr)) delete response[attr];
    });
  }

  const attributes = Object.keys(response);
  for (let i = 0; i < attributes.length; i += 1) {
    if (response[attributes[i]] === undefined) delete response[attributes[i]];
  }

  return response;

  // TODO: ApproximateNumberOfMessagesDelayed
  // TODO: ApproximateNumberOfMessagesNotVisible
  // TODO: CreatedTimestamp - make sure timestamp is created when queue is created
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
  const convertedQueue = QueueUrl.replace(/http:\/\/localhost:\d{4}\/queues\//g, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.',
      'AWS.SimpleQueueService.NonExistentQueue'
    );
  }
  queue.messages = [];
}

module.exports = {
  clearQueues,
  createQueue,
  deleteMessage,
  deleteQueue,
  getQueueAttributes,
  getQueueState,
  getQueueUrl,
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
