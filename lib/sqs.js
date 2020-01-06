'use strict';

const md5 = require('md5');
const uuid = require('uuid');
const { Queue } = require('./utils/validations');

const AWS_URL = 'https://queue.amazonaws.com/queues/';
const QUEUE_ARN = 'arn:aws:sqs:us-east-1:queues:';

const queues = new Map();

function validateQueueName(queueName, isFifo) {
  if (isFifo && !queueName.endsWith('.fifo')) {
    throw Object.assign(
      new Error(
        'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.'
      ),
      { code: 'InvalidParameterValue' }
    );
  }
}

function validateDeadLetterQueue(deadLetterQueueArn, isFifo) {
  let foundArn;

  queues.forEach(value => {
    if (value.Attributes.QueueArn === deadLetterQueueArn) {
      foundArn = deadLetterQueueArn;
      if (value.Attributes.FifoQueue !== isFifo) {
        throw Object.assign(
          new Error(
            `Value {&quot;deadLetterTargetArn&quot;:&quot;${deadLetterQueueArn}&quot;,&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Dead-letter target owner should be same as the source.`
          ),
          { code: 'InvalidParameterValue' }
        );
      }
    }
  });
  if (!foundArn) {
    throw Object.assign(
      new Error(
        `Value {&quot;deadLetterTargetArn&quot;:&quot;${deadLetterQueueArn}&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.`
      ),
      { code: 'InvalidParameterValue' }
    );
  }
}

function validateNoContentBasedDeduplication(contentBasedDeduplication) {
  if (contentBasedDeduplication) {
    throw Object.assign(new Error('Unknown Attribute ContentBasedDeduplication.'), {
      code: 'InvalidAttributeName'
    });
  }
}

function queueAlreadyExists(queueName, attributes) {
  const queueWithSameName = queues.get(`${AWS_URL}${queueName}`);
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
        throw Object.assign(
          new Error(
            `A queue already exists with the same name and a different value for attribute RedrivePolicy`
          ),
          { code: 'QueueAlreadyExists' }
        );
      }
    }

    for (let i = 0; i < compareAttributes.length; i += 1) {
      if (
        queueWithSameName.Attributes[compareAttributes[i]] &&
        attributes[compareAttributes[i]] &&
        queueWithSameName.Attributes[compareAttributes[i]] !== attributes[compareAttributes[i]]
      ) {
        throw Object.assign(
          new Error(
            `A queue already exists with the same name and a different value for attribute ${compareAttributes[i]}`
          ),
          { code: 'QueueAlreadyExists' }
        );
      }
    }
  }
}

function clearQueues() {
  queues.clear();
}

function getQueueState(QueueUrl) {
  const convertedQueue = QueueUrl.replace(
    /http:\/\/localhost:\d{4}/g,
    'https://queue.amazonaws.com'
  );

  return queues.get(convertedQueue);
}

// TODO: consider returning full queue state from this file and have separate file that formats it for the actions. State needs to be tested
function createQueue(params) {
  const queueParams = Queue(params);

  const { Attributes, QueueName, tags } = queueParams;
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

  const queueUrl = `${AWS_URL}${QueueName}`;
  const queueArn = `${QUEUE_ARN}${QueueName}`;
  queues.set(queueUrl, {
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
    readMessages: [],
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

  // TODO: store queue name as key, remove domain/url part
  const convertedQueue = QueueUrl.replace(
    /http:\/\/localhost:\d{4}/g,
    'https://queue.amazonaws.com'
  );

  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw Object.assign(new Error('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.'), {
      code: 'AWS.SimpleQueueService.NonExistentQueue'
    });
  }
  // TODO: make actual delay work for DelaySeconds

  const { Attributes } = queue;
  const { ContentBasedDeduplication, FifoQueue } = Attributes;

  if (FifoQueue && !MessageGroupId) {
    throw Object.assign(new Error('The request must contain the parameter MessageGroupId.'), {
      code: 'MissingParameter'
    });
  }

  if (FifoQueue && !ContentBasedDeduplication && !MessageDeduplicationId) {
    throw Object.assign(
      new Error(
        'The queue should either have ContentBasedDeduplication enabled or MessageDeduplicationId provided explicitly'
      ),
      {
        code: 'InvalidParameterValue'
      }
    );
  }

  const MessageId = uuid();
  const { DelaySeconds = null } = FifoQueue ? Attributes : params;

  const message = {
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

function listQueues() {
  const list = [];
  queues.forEach((value, key) => list.push(key));
  return list;
}

function receiveMessage(params) {
  const { MaxNumberOfMessages, MessageAttributeNames, QueueUrl, VisibilityTimeout } = params;
  const convertedQueue = QueueUrl.replace(
    /http:\/\/localhost:\d{4}/g,
    'https://queue.amazonaws.com'
  );

  const queue = queues.get(convertedQueue);

  if (!queue) {
    throw Object.assign(new Error('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.'), {
      code: 'AWS.SimpleQueueService.NonExistentQueue'
    });
  }

  // if (WaitTimeSeconds) {
  //   // TODO: amount of time can wait for messages
  // }

  const messages = [];
  if (MaxNumberOfMessages && MaxNumberOfMessages > 1) {
    for (let i = 0; i < MaxNumberOfMessages; i += 1) {
      // messages.push(queue.messages.shift()); // TODO: optimize?
      const msg = queue.messages.shift();
      if (msg) messages.push(msg);
    }
  } else {
    const msg = queue.messages.shift();
    if (msg) messages.push(msg); // TODO: make sure that messages exist. This error can occur when no messages were sent to queue, but read from queue was attempted. Test this scenario with AWS
  }

  if (VisibilityTimeout) {
    for (let i = 0; i < messages.length; i += 1) {
      const readMessage = messages[i];
      // TODO: fix this code
      // if (MessageAttribute && MessageAttribute !== 'All') {
      //   if (readMessage.MessageAttributes[MessageAttribute]) {
      //     const msgAttr = readMessage.MessageAttributes[MessageAttribute];
      //     readMessage.MessageAttributes = msgAttr;
      //   }
      // }
      readMessage.VisibilityTimeout = VisibilityTimeout;
      queue.readMessages.push(readMessage);
    }
  } else {
    queue.readMessages = queue.readMessages.concat(messages);
  }

  return messages.map(message => {
    const { MessageAttributes, MessageBody, MessageId } = message;

    let msgAttrs;
    if (MessageAttributeNames) {
      msgAttrs = MessageAttributeNames.includes('All')
        ? MessageAttributes
        : MessageAttributeNames.reduce((acc, item) => {
            const value = MessageAttributes[item];
            if (value === undefined) return acc;
            return { ...acc, [item]: value };
          }, {});
    }

    return {
      Body: MessageBody,
      MD5OfBody: md5(MessageBody),
      MessageId,
      ReceiptHandle: '0000000',
      ...(MessageAttributeNames && {
        MD5OfMessageAttributes: md5(MessageAttributeNames.join(',')),
        MessageAttributes: msgAttrs
      })
    };
  });
}

module.exports = {
  clearQueues,
  createQueue,
  getQueueState,
  listQueues,
  receiveMessage,
  sendMessage
};
