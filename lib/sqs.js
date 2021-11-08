'use strict';

const md5 = require('md5');
const uuid = require('uuid').v4;

const { assertQueue } = require('./utils/validations');
const { ErrorWithCode } = require('./utils/errors');
const messageAttributesMD5Checksum = require('./utils/message-attributes-md5-checksum');

const QUEUE_ARN = 'arn:aws:sqs:us-east-1:queues:';
const QUEUE_URL_REGEX = /http:\/\/localhost:\d+\/queues\//g;

const CONTENT_DEDUPLICATION_INTERVAL_5_MIN = 5 * 60 * 1000;
const NON_EXISTENT_QUEUE_MESSAGE = 'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.';
const NON_EXISTENT_QUEUE_CODE = 'AWS.SimpleQueueService.NonExistentQueue';

/**
 * @type {Map.<string, QueueObject>}
 */
const queues = new Map();

/**
 * Validates if the queue name follows naming convention.
 *
 * @param {string} queueName - The name of the queue.
 * @param {boolean} isFifo - FiFo queue check to determine name suffix.
 * @returns {void}
 * @throws InvalidParameterValue, thrown when queue name is invalid.
 */
function validateQueueName(queueName, isFifo) {
  if ((isFifo && !queueName.endsWith('.fifo')) || (!isFifo && queueName.endsWith('.fifo'))) {
    throw new ErrorWithCode(
      'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.',
      'InvalidParameterValue'
    );
  }
}

/**
 * Validates existence of dead letter queue.
 *
 * @param {string} deadLetterQueueArn - Amazon Resource Name for dead letter queue.
 * @param {boolean} isFifo - Fifo queue check to match source.
 * @returns {void}
 * @throws InvalidParameterValue, thrown when dead letter queue fails validation.
 */
function validateDeadLetterQueue(deadLetterQueueArn, isFifo) {
  let foundArn;
  const iterator = queues.values();

  for (let i = 0; i < queues.size; i += 1) {
    const { value } = iterator.next();
    if (value.Attributes.QueueArn === deadLetterQueueArn) {
      foundArn = deadLetterQueueArn;
      if (value.Attributes.FifoQueue !== isFifo) {
        throw new ErrorWithCode(
          `Value {&quot;deadLetterTargetArn&quot;:&quot;${deadLetterQueueArn}&quot;,&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Dead-letter target owner should be same as the source.`,
          'InvalidParameterValue'
        );
      }
    }
  }
  if (!foundArn) {
    throw new ErrorWithCode(
      `Value {&quot;deadLetterTargetArn&quot;:&quot;${deadLetterQueueArn}&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.`,
      'InvalidParameterValue'
    );
  }
}

/**
 * Content based deduplication flag.
 *
 * @param {boolean} contentBasedDeduplication - Content based deduplication.
 * @returns {void}
 * @throws InvalidAttributeName
 */
function validateNoContentBasedDeduplication(contentBasedDeduplication) {
  if (contentBasedDeduplication) {
    throw new ErrorWithCode('Unknown Attribute ContentBasedDeduplication.', 'InvalidAttributeName');
  }
}

/**
 * Checks if there is an existing queue with the same attributes.
 *
 * @param {string} queueName - The name of the queue.
 * @param {Object.<string, any>} attributes - The attributes of the queue.
 * @returns {void}
 * @throws QueueAlreadyExists, thrown when queue with the same name and different attribute already exists.
 */
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

    if (
      attributes &&
      attributes.RedrivePolicy &&
      queueWithSameName.Attributes.RedrivePolicy &&
      (queueWithSameName.Attributes.RedrivePolicy.deadLetterTargetArn !==
        attributes.RedrivePolicy.deadLetterTargetArn ||
        queueWithSameName.Attributes.RedrivePolicy.maxReceiveCount !==
          attributes.RedrivePolicy.maxReceiveCount)
    ) {
      throw new ErrorWithCode(
        `A queue already exists with the same name and a different value for attribute RedrivePolicy`,
        'QueueAlreadyExists'
      );
    }

    const wrongAttr = compareAttributes.find(
      /**
       * @param {string} attr - attributes.
       * @returns {boolean}
       */
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

/**
 * Clears all queues.
 *
 * @returns {void}
 */
function clearQueues() {
  queues.clear();
}

/**
 * Gets state of queue.
 *
 * @param {string} QueueUrl - The url for the queue.
 * @returns {QueueObject|undefined} The requested queue.
 */
function getQueueState(QueueUrl) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');

  return queues.get(convertedQueue);
}

/**
 * Creates a queue.
 *
 * @param {CreateQueueParams} params - Parameters for createQueue.
 * @param {string} host - Host name for the queue url.
 * @returns {string} The queue URL.
 */
function createQueue(params, host) {
  const queueParams = assertQueue(params);
  /** @type {*} */
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
  const queueObject = {
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
  };

  queues.set(QueueName, queueObject);

  return queueUrl;
}

/**
 * Sends a message.
 *
 * @param {SendMessageParams} params - Parameters for the message.
 * @returns {EncodedMessage} - The encoded message.
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 * @throws MissingParameter, thrown if parameter MessageGroupId is missing.
 */
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
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
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
    const { messages } = queue;
    const duplicate = messages.find(
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
    MessageBody,
    MessageId,
    ...(MessageAttributes && { MessageAttributes }),
    ...(MessageDeduplicationId && {
      MessageDeduplicationId,
      SequenceNumber: '00000000000000000000'
    }),
    ...(DelaySeconds && { DelaySeconds }),
    ...(MessageSystemAttributes && { MessageSystemAttributes }),
    MessageGroupId
  };

  const encodedMessage = {
    MD5OfMessageBody: md5(MessageBody),
    MessageId,
    ...(MessageAttributes && {
      MD5OfMessageAttributes: md5(MessageAttributes)
    }),
    ...(MessageDeduplicationId && {
      MessageDeduplicationId,
      SequenceNumber: '00000000000000000000'
    }),
    ...(DelaySeconds && { DelaySeconds }),
    ...(MessageSystemAttributes && {
      MD5OfMessageSystemAttributes: md5(MessageSystemAttributes)
    })
  };

  queue.messages.push(message);
  return encodedMessage;
}

/**
 * Send messages in a batch to a specified queue
 *
 * @param {SendMessageBatchParams} params - Parameters for the messages.
 * @returns {Array<EncodedMessage>} - The array of messages sent.
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function sendMessageBatch(params) {
  const { QueueUrl, messages } = params;

  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
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

/**
 * Get the current list of queues.
 *
 * @returns {Array<QueueObject>} - The array of queues.
 */
function listQueues() {
  const list = [];
  const iterator = queues.keys();

  for (let i = 0; i < queues.size; i += 1) {
    list.push(iterator.next().value);
  }
  return list;
}

/**
 * Prepare received messages by mapping them into the correct format.
 *
 * @param {Array<string>} AttributeNames - The names of the queue attributes.
 * @param {Array<string>} MessageAttributeNames - The names of the message attributes.
 * @param {string} ReceiptHandle - The receipt handle identifier.
 * @param {Array<MessageObject>} messages - The array of messages.
 * @returns {Array<PreparedMessages>} - The prepared messages.
 */
function prepareMessages(AttributeNames, MessageAttributeNames, ReceiptHandle, messages) {
  return messages.map(
    /**
     * @param {Object} msg - Message object.
     * @param {Object.<string, any>} msg.Attributes - Attributes.
     * @param {Object.<string, any>} msg.MessageAttributes - MessageAttributes.
     * @param {string} msg.MessageBody - MessageBody.
     * @param {string} msg.MessageId - MessageId.
     * @returns {PreparedMessages}
     */
    ({ Attributes, MessageAttributes, MessageBody, MessageId }) => ({
      Body: MessageBody,
      MD5OfBody: md5(MessageBody),
      MessageId,
      ReceiptHandle,
      ...(AttributeNames && {
        Attributes: AttributeNames.includes('All')
          ? Attributes
          : Object.fromEntries(
              Object.entries(Attributes).filter(([key]) => AttributeNames.includes(key))
            )
      }),
      ...(MessageAttributeNames &&
        MessageAttributeNames.length > 0 && {
          MD5OfMessageAttributes: md5(MessageAttributeNames.join(',')),
          MessageAttributes: MessageAttributeNames.includes('All')
            ? MessageAttributes
            : Object.fromEntries(
                Object.entries(MessageAttributes).filter(([key]) =>
                  MessageAttributeNames.includes(key)
                )
              )
        })
    })
  );
}

/**
 * Retrieves messages from the specified queue.
 *
 * @param {Object} params - The receive message parameters.
 * @param {Array<string>} params.AttributeNames - The names of the queue attributes.
 * @param {number} [params.MaxNumberOfMessages] - The names of the message attributes.
 * @param {Array<string>} params.MessageAttributeNames - The message attribute names.
 * @param {number} [params.VisibilityTimeout] - Timeout for the message being processed by other consumers.
 * @param {string} params.QueueUrl - The url of the queue to retrieve from.
 * @returns {Array<PreparedMessages>} - The retrieved and prepared messages.
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
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
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
  }

  const stateParams = VisibilityTimeout ? { VisibilityTimeout, isRead: true } : { isRead: true };
  const ReceiptHandle = uuid(); // TODO: make unique ReceiptHandle for every message

  /** @type {Array<*>} */
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

    /** @type {Object.<string, any>} */
    const messageTest = {};

    let count = 0;
    for (let i = 0; i < queue.messages.length; i += 1) {
      if (count >= MaxNumberOfMessages) break;
      const msg = queue.messages[i];

      if (
        msg['@State'].isRead === false &&
        msg.MessageGroupId === firstMessageGroupId &&
        msg.Attributes.AvailableSince - Date.now() <= 0
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
            ApproximateFirstReceiveTimestamp: Date.now(),
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
      /** @type {*} */
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
        ApproximateFirstReceiveTimestamp: Date.now(),
        ApproximateReceiveCount: msg.Attributes.ApproximateReceiveCount + 1
      }
    }));
    remainingMessages = unreadMessages.slice(MaxNumberOfMessages);
    queue.messages = [...readMessages, ...messages, ...remainingMessages];
  }
  return prepareMessages(AttributeNames, MessageAttributeNames, ReceiptHandle, messages);
}

/**
 * Deletes message from the specified queue.
 *
 * @param {Object} params - Parameters for deleteMessage.
 * @param {string} params.QueueUrl - The url for the queue to delete from.
 * @param {string} params.ReceiptHandle - The receipt handle identifier.
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function deleteMessage({ QueueUrl, ReceiptHandle }) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
  }

  queue.messages = queue.messages.filter((msg) => msg['@State'].ReceiptHandle !== ReceiptHandle);
}

/**
 * Delete messages in a batch from the specified queue.
 *
 * @param {string} QueueUrl - The url for the queue to delete from.
 * @param {Array<DeleteMessageBatchRequestEntry>} Entries - List of messages to delete.
 * @returns {Array<string>} - The list of Ids of deleted messages.
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function deleteMessageBatch(QueueUrl, Entries) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
  }

  const entriesList = new Set(Entries.map(({ ReceiptHandle }) => ReceiptHandle));
  const entriesIds = Entries.map(({ Id }) => Id);

  queue.messages = queue.messages.filter((msg) => entriesList.has(msg['@State'].ReceiptHandle));
  return entriesIds;
}

/**
 * Deletes specified queue.
 *
 * @param {Object} Params - The params for deleteQueue.
 * @param {string} Params.QueueUrl - The url for the queue to be deleted.
 * @returns {void}
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function deleteQueue({ QueueUrl }) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
  }
  queues.delete(convertedQueue);
}

/**
 * Add tags to specified queue.
 *
 * @param {string} QueueUrl - The url for the queue to add tags to.
 * @param {Object.<string,string>} tags - Tags to add.
 * @returns {void}
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function tagQueue(QueueUrl, tags) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);
  if (!queue) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
  }

  queue.tags = { ...queue.tags, ...tags };
}

/**
 * View tags of specified queue.
 *
 * @param {string} QueueUrl - The url for the queue to add tags to.
 * @returns {Object.<string, string>} Returns map of tags.
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function listQueueTags(QueueUrl) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);
  if (!queue) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
  }

  return queue.tags;
}

/**
 * Removes tags from specified queue.
 *
 * @param {string} QueueUrl - The url for the queue to remove tags from.
 * @param {Array<string>} removeTags - Tags to be removed.
 * @returns {void}
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function untagQueue(QueueUrl, removeTags) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);
  if (!queue) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
  }

  for (const tag of removeTags) {
    if (queue.tags[tag]) delete queue.tags[tag];
  }
}

/**
 * Add attributes to specified queue.
 *
 * @param {string} QueueUrl - The url for the queue to add attributes to.
 * @param {Object.<string, any>} Attributes - The queue attributes to set.
 * @returns {void}
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function setQueueAttributes(QueueUrl, Attributes) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
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

/**
 * Retrieve attributes from the specified queue.
 *
 * @param {string} QueueUrl - The url for the queue to remove tags from.
 * @param {Array<string>} Attributes - The name of attributes to retrieve information from.
 * @returns {Object.<string, any>} - Returns attribute object.
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function getQueueAttributes(QueueUrl, Attributes) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
  }

  /** @type {Object.<string, any>} */
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
}

/**
 * Retrieves the queue url.
 *
 * @param {string} QueueName - Name for the queue.
 * @param {string} host - Host name for the queue url.
 * @returns {string} - The queue URL.
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function getQueueUrl(QueueName, host) {
  if (!queues.get(QueueName)) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
  }
  return `http://${host}/queues/${QueueName}`;
}

/**
 * Delete all messages from the specified queue.
 *
 * @param {string} QueueUrl - The url of the queue to purge.
 * @returns {void}
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist.
 */
function purgeQueue(QueueUrl) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(NON_EXISTENT_QUEUE_MESSAGE, NON_EXISTENT_QUEUE_CODE);
  }
  queue.messages = [];
}

/**
 * Retrieve all queues with the RedrivePolicy attribute set to a dead letter queue.
 *
 * @param {string} QueueUrl - The url of the queue to search.
 * @param {string} host - Host name for the queue url.
 * @returns {Array<string>} - The list of queue urls.
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist for specific wsdl version.
 */
function listDeadLetterSourceQueues(QueueUrl, host) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'The specified queue does not exist for this wsdl version.',
      NON_EXISTENT_QUEUE_CODE
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

/**
 * Sets the visibility timeout for a specified message in the queue.
 *
 * @param {Object} params - The params for changeMessageVisibility.
 * @param {string} params.QueueUrl - The url for the queue that contains the message.
 * @param {string} params.ReceiptHandle - The receipt handle identifier.
 * @param {number} params.VisibilityTimeout - The new visibility timeout value.
 * @returns {void}
 * @throws AWS.SimpleQueueService.NonExistentQueue, thrown if queue does not exist for specific wsdl version.
 * @throws ClientError, thrown if VisibilityTimeout is outside of range 0 - 43200.
 */
function changeMessageVisibility({ QueueUrl, ReceiptHandle, VisibilityTimeout }) {
  const convertedQueue = QueueUrl.replace(QUEUE_URL_REGEX, '');
  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw new ErrorWithCode(
      'The specified queue does not exist for this wsdl version.',
      NON_EXISTENT_QUEUE_CODE
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

/**
 *
 * Type for parameters of the `createQueue` method.
 *
 * @typedef {Object} CreateQueueParams
 * @property {Object.<string, any>} [Attributes] - The attributes for the queue.
 * @property {string} QueueName - The name of the queue.
 * @property {Object.<string, string>} [tags] - Tags for the queue
 */

/**
 *
 * Type for queue attributes.
 *
 * @typedef {Object} QueueAttributes
 * @property {boolean} ContentBasedDeduplication - Content based deduplication flag.
 * @property {number} CreatedTimestamp - Timestamp of when the queue was created.
 * @property {number} DelaySeconds - Delay amount in seconds.
 * @property {boolean} FifoQueue - Fifo queue flag.
 * @property {number} KmsDataKeyReusePeriodSeconds - Amount of time data key can be reused in seconds.
 * @property {string} KmsMasterKeyId - Key Id.
 * @property {number} MaximumMessageSize - Maximum Message Size in bytes.
 * @property {number} MessageRetentionPeriod - Amount of time message will be retained in seconds.
 * @property {string} QueueArn - The Amazon Resource Name of the queue.
 * @property {number} ReceiveMessageWaitTimeSeconds - Wait time to receive message in seconds.
 * @property {Object} RedrivePolicy - Redrive policy.
 * @property {string} RedrivePolicy.deadLetterTargetArn - Amazon Resource Name of the dead letter queue.
 * @property {number} RedrivePolicy.maxReceiveCount - Maximum number of times a message gets delivered before being moved to dead letter queue.
 * @property {number} VisibilityTimeout - Visibility timeout in seconds.
 */

/**
 *
 * Type for parameters of the `sendMessage` method.
 *
 * @typedef {Object} SendMessageParams
 * @property {number} [DelaySeconds] - Delay amount in seconds.
 * @property {any} [MessageAttributes] - The message attributes
 * @property {string} MessageBody - The body of the message.
 * @property {string} [MessageDeduplicationId] - The deduplication Id.
 * @property {string} [MessageGroupId] - Group Id for the message.
 * @property {any} [MessageSystemAttributes] - Consists of the same options as MessageAttributes.
 * @property {string} QueueUrl - The url for the queue.
 */

/**
 *
 * Type for Queue Objects
 *
 * @typedef {Object} QueueObject
 * @property {(QueueAttributes|Object.<string|number, any>)} Attributes - The queue attributes.
 * @property {Array<Object.<string, any>>} messages - Messages in the queue.
 * @property {Object<string, string>} tags - Key-value pairs for tags.
 */

/**
 *
 * Type for Message Objects
 *
 * @typedef {Object} MessageObject
 * @property {Object.<string, any>} Attributes - The queue attributes.
 * @property {number} DelaySeconds - Delay for messages in seconds.
 * @property {Object.<string, any>} MessageAttributes - The message attributes.
 * @property {string} MessageBody - The body of the message.
 * @property {string} MessageDeduplicationId - The deduplication Id.
 * @property {string} MessageGroupId - Group Id for the message.
 * @property {string} MessageId - The message ID.
 * @property {Object.<string, any>} MessageSystemAttributes - Consists of the same options as MessageAttributes.
 */

/**
 *
 * Type for Message Objects in batch request.
 *
 * @typedef {Object} MessageBatchObject
 * @property {number} DelaySeconds - Delay for messages in seconds.
 * @property {string} Id - The queue ID.
 * @property {Object} [MessageAttributes] - The message attributes.
 * @property {string} MessageBody - The body of the message.
 * @property {string} [MessageDeduplicationId] - The deduplication Id.
 * @property {string} [MessageGroupId] - Group Id for the message.
 * @property {Object} [MessageSystemAttributes] - Consists of the same options as MessageAttributes.
 */

/**
 *
 * Type for parameters of the `sendMessageBatch` method.
 *
 * @typedef {Object} SendMessageBatchParams
 * @property {Array<MessageBatchObject>} messages - The messages to send in the same format, with individual messages in the same format as SendMessageParams
 * @property {string} QueueUrl - The url for the queue.
 */

/**
 *
 * Type for returned object of `preparedMessages` method.
 *
 * @typedef {Object} PreparedMessages
 * @property {Object.<string, any>} [Attributes] - The attributes for the queue.
 * @property {string} Body - The body of the message.
 * @property {string} [MD5OfBody] - MD5 of the body of the message.
 * @property {string} [MD5OfMessageAttributes] - MD5 of the message attributes.
 * @property {Object.<string, any>} [MessageAttributes] - The message attributes.
 * @property {string} MessageId - The message Id.
 * @property {string} ReceiptHandle - The receipt handle identifier.
 */

/**
 *
 * Type for parameter object of `deleteMessageBatch` method.
 *
 * @typedef {Object} DeleteMessageBatchRequestEntry
 * @property {string} Id - Message ID.
 * @property {string} ReceiptHandle - The receipt handle identifier.
 */

/**
 *
 * Type for encoded messages
 *
 * @typedef {Object} EncodedMessage
 * @property {number} [DelaySeconds] - Amount of delay in seconds.
 * @property {string} [Id] - Batch request ID.
 * @property {string} [MD5OfMessageAttributes] - MD5 of message attributes.
 * @property {string} [MD5OfMessageSystemAttributes] - MD5 of Message System Attributes.
 * @property {string} [MD5OfMessageBody] - MD5 of message body.
 * @property {string} [MessageDeduplicationId] - The message dedupliaction ID.
 * @property {string} MessageId - Message ID.
 * @property {string} [SequenceNumber] - The large nonconsecutive number attached to each message.
 */
