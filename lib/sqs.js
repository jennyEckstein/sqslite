'use strict';

const md5 = require('md5');
const uuid = require('uuid');
const { Queue } = require('./utils/validations');

const AWS_URL = 'https://queue.amazonaws.com/123/';
const QUEUE_ARN = 'arn:aws:sqs:us-east-1:123:';

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
    tags
  });

  return queueUrl;
}

function sendMessage(params) {
  // console.log('ORIGINAL QUEUE', params.QueueUrl);
  const convertedQueue = params.QueueUrl.replace(
    /http:\/\/localhost:\d{4}/g,
    'https://queue.amazonaws.com'
  );

  // console.log('CONVERTED QUEUE', convertedQueue);
  const queue = queues.get(convertedQueue);
  // console.log('QUEUE:', queue);
  if (!queue) {
    throw Object.assign(new Error('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.'), {
      code: 'AWS.SimpleQueueService.NonExistentQueue'
    });
  }
  // TODO: make actual delay work for DelaySeconds

  const message = {
    MessageBody: params.MessageBody, // TODO: assert for all valid message variations
    MessageId: uuid.v4()
  };

  const encodedMessage = {
    MD5OfMessageBody: md5(params.MessageBody),
    MessageId: message.MessageId
  };

  if (params.MessageAttributes) {
    message.MessageAttributes = params.MessageAttributes; // TODO: don't think this is the right way to do it
    encodedMessage.MessageAttributes = md5(params.MessageAttributes);
  }

  if (queue.Attributes.FifoQueue && !params.MessageGroupId) {
    throw Object.assign(new Error('The request must contain the parameter MessageGroupId.'), {
      code: 'MissingParameter'
    });
  }

  if (queue.Attributes.FifoQueue) {
    if (!queue.Attributes.ContentBasedDeduplication && !params.MessageDeduplicationId) {
      throw Object.assign(
        new Error(
          'The queue should either have ContentBasedDeduplication enabled or MessageDeduplicationId provided explicitly'
        ),
        {
          code: 'InvalidParameterValue'
        }
      );
    }
  }

  if (params.MessageDeduplicationId) {
    message.SequenceNumber = '18850180853819632128'; // TODO: The length of SequenceNumber is 128 bits, continues to increase for a particular MessageGroupId. Implement seq number
    encodedMessage.SequenceNumber = '18850180853819632128';
  }

  // TODO: see if better way to avoid assignment of undefined
  let delaySeconds;
  if (queue.Attributes.FifoQueue) {
    delaySeconds = queue.Attributes.DelaySeconds;
  } else {
    delaySeconds = params.DelaySeconds || null;
  }

  if (delaySeconds) {
    message.DelaySeconds = delaySeconds;
    encodedMessage.DelaySeconds = delaySeconds;
  }

  queue.messages = queue.messages ? [...queue.messages, message] : [message];

  return encodedMessage;
}

function listQueues() {
  const list = [];
  queues.forEach((value, key) => list.push(key));
  return list;
}

module.exports = {
  clearQueues,
  createQueue,
  listQueues,
  sendMessage
};
