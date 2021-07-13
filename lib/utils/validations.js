'use strict';

const { boolean, create, defaulted, define, object, optional, string } = require('superstruct');

const { ErrorWithCode } = require('./errors');

const structs = {
  delaySeconds: define('delaySeconds', (delaySeconds) => {
    if (delaySeconds < 0 || delaySeconds > 900) {
      throw new ErrorWithCode(
        'Invalid value for the parameter DelaySeconds.',
        'InvalidAttributeValue'
      );
    }
    return true;
  }),

  kmsDataKeyReusePeriodSeconds: define(
    'kmsDataKeyReusePeriodSeconds',
    (kmsDataKeyReusePeriodSeconds) => {
      if (kmsDataKeyReusePeriodSeconds < 60 || kmsDataKeyReusePeriodSeconds > 86400) {
        throw new ErrorWithCode(
          'Invalid value for the parameter KmsDataKeyReusePeriodSeconds.',
          'InvalidAttributeValue'
        );
      }
      return true;
    }
  ),

  maximumMessageSize: define('maximumMessageSize', (maximumMessageSize) => {
    if (maximumMessageSize < 1024 || maximumMessageSize > 262144) {
      throw new ErrorWithCode(
        'Invalid value for the parameter MaximumMessageSize.',
        'InvalidAttributeValue'
      );
    }
    return true;
  }),

  messageRetentionPeriod: define('messageRetentionPeriod', (messageRetentionPeriod) => {
    if (messageRetentionPeriod < 60 || messageRetentionPeriod > 1209600) {
      throw new ErrorWithCode(
        'Invalid value for the parameter MessageRetentionPeriod.',
        'InvalidAttributeValue'
      );
    }
    return true;
  }),

  queueName: define('queueName', (queueName) => {
    if (queueName.length > 80) {
      throw new ErrorWithCode(
        'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length',
        'InvalidParameterValue'
      );
    }

    if (!/^[\w-]*\.fifo$|^[\w-]*$/.test(queueName)) {
      throw new ErrorWithCode(
        'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length',
        'InvalidParameterValue'
      );
    }
    return true;
  }),

  receiveMessageWaitTimeSeconds: define(
    'receiveMessageWaitTimeSeconds',
    (receiveMessageWaitTimeSeconds) => {
      if (receiveMessageWaitTimeSeconds < 0 || receiveMessageWaitTimeSeconds > 20) {
        throw new ErrorWithCode(
          'Invalid value for the parameter ReceiveMessageWaitTimeSeconds.',
          'InvalidAttributeValue'
        );
      }
      return true;
    }
  ),

  redrivePolicy: define('redrivePolicy', (redrivePolicy) => {
    if (!redrivePolicy) return true;

    if (redrivePolicy && !redrivePolicy.deadLetterTargetArn) {
      throw new ErrorWithCode(
        'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.',
        'InvalidParameterValue'
      );
    }

    if (redrivePolicy && !redrivePolicy.maxReceiveCount) {
      throw new ErrorWithCode(
        'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.',
        'InvalidParameterValue'
      );
    }

    return true;
  }),

  visibilityTimeout: define('visibilityTimeout', (visibilityTimeout) => {
    if (visibilityTimeout < 0 || visibilityTimeout > 43200) {
      throw new ErrorWithCode(
        'Invalid value for the parameter VisibilityTimeout.',
        'InvalidAttributeValue'
      );
    }
    return true;
  })
};

const DefaultAttributes = {
  DelaySeconds: 0,
  FifoQueue: false,
  KmsDataKeyReusePeriodSeconds: 300,
  KmsMasterKeyId: 'alias/aws/sqs',
  MaximumMessageSize: 262144,
  MessageRetentionPeriod: 345600,
  ReceiveMessageWaitTimeSeconds: 0,
  VisibilityTimeout: 30
};
const attributes = object({
  ContentBasedDeduplication: defaulted(optional(boolean()), false),
  DelaySeconds: defaulted(structs.delaySeconds, 0),
  FifoQueue: defaulted(optional(boolean()), false),
  KmsDataKeyReusePeriodSeconds: defaulted(optional(structs.kmsDataKeyReusePeriodSeconds), 300),
  KmsMasterKeyId: defaulted(optional(string()), 'alias/aws/sqs'),
  MaximumMessageSize: defaulted(optional(structs.maximumMessageSize), 262144),
  MessageRetentionPeriod: defaulted(optional(structs.messageRetentionPeriod), 345600),
  ReceiveMessageWaitTimeSeconds: defaulted(optional(structs.receiveMessageWaitTimeSeconds), 0),
  RedrivePolicy: structs.redrivePolicy,
  VisibilityTimeout: defaulted(optional(structs.visibilityTimeout), 30)
});

const Queue = object({
  Attributes: defaulted(optional(attributes), DefaultAttributes),
  QueueName: structs.queueName,
  tags: optional(object())
});

const Message = object({
  DelaySeconds: optional(structs.delaySeconds),
  MessageBody: string(),
  QueueUrl: string()
});

const assertMessage = (params) => {
  return create(params, Message);
};

const assertQueue = (params) => {
  return create(params, Queue);
};

module.exports = {
  assertMessage,
  assertQueue
};
