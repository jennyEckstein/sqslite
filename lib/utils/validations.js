'use strict';

const { superstruct } = require('superstruct');

const struct = superstruct({
  types: {
    delaySeconds: delaySeconds => {
      if (delaySeconds < 0 || delaySeconds > 900) {
        throw Object.assign(new Error('Invalid value for the parameter DelaySeconds.'), {
          code: 'InvalidAttributeValue'
        });
      }
      return true;
    },
    kmsDataKeyReusePeriodSeconds: kmsDataKeyReusePeriodSeconds => {
      if (kmsDataKeyReusePeriodSeconds < 60 || kmsDataKeyReusePeriodSeconds > 86400) {
        throw Object.assign(
          new Error('Invalid value for the parameter KmsDataKeyReusePeriodSeconds.'),
          { code: 'InvalidAttributeValue' }
        );
      }
      return true;
    },
    maximumMessageSize: maximumMessageSize => {
      if (maximumMessageSize < 1024 || maximumMessageSize > 262144) {
        throw Object.assign(new Error('Invalid value for the parameter MaximumMessageSize.'), {
          code: 'InvalidAttributeValue'
        });
      }
      return true;
    },
    messageRetentionPeriod: messageRetentionPeriod => {
      if (messageRetentionPeriod < 60 || messageRetentionPeriod > 1209600) {
        throw Object.assign(new Error('Invalid value for the parameter MessageRetentionPeriod.'), {
          code: 'InvalidAttributeValue'
        });
      }
      return true;
    },
    queueName: queueName => {
      if (queueName.length > 80) {
        throw Object.assign(
          new Error(
            'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
          ),
          { code: 'InvalidParameterValue' }
        );
      }

      if (!/^[a-zA-Z0-9-_]*\.fifo$|^[a-zA-Z0-9-_]*$/.test(queueName)) {
        throw Object.assign(
          new Error(
            'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
          ),
          { code: 'InvalidParameterValue' }
        );
      }
      return true;
    },
    receiveMessageWaitTimeSeconds: receiveMessageWaitTimeSeconds => {
      if (receiveMessageWaitTimeSeconds < 0 || receiveMessageWaitTimeSeconds > 20) {
        throw Object.assign(
          new Error('Invalid value for the parameter ReceiveMessageWaitTimeSeconds.'),
          { code: 'InvalidAttributeValue' }
        );
      }
      return true;
    },
    redrivePolicy: redrivePolicy => {
      if (!redrivePolicy) return true;

      if (redrivePolicy && !redrivePolicy.deadLetterTargetArn) {
        throw Object.assign(
          new Error(
            'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
          ),
          { code: 'InvalidParameterValue' }
        );
      }

      if (redrivePolicy && !redrivePolicy.maxReceiveCount) {
        throw Object.assign(
          new Error(
            'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.'
          ),
          { code: 'InvalidParameterValue' }
        );
      }

      return true;
    },
    visibilityTimeout: visibilityTimeout => {
      if (visibilityTimeout < 0 || visibilityTimeout > 43200) {
        throw Object.assign(new Error('Invalid value for the parameter VisibilityTimeout.'), {
          code: 'InvalidAttributeValue'
        });
      }
      return true;
    }
  }
});

const Queue = struct({
  Attributes: struct(
    {
      ContentBasedDeduplication: 'boolean?',
      DelaySeconds: 'delaySeconds',
      FifoQueue: 'boolean',
      KmsDataKeyReusePeriodSeconds: 'kmsDataKeyReusePeriodSeconds',
      KmsMasterKeyId: 'string',
      MaximumMessageSize: 'maximumMessageSize',
      MessageRetentionPeriod: 'messageRetentionPeriod',
      ReceiveMessageWaitTimeSeconds: 'receiveMessageWaitTimeSeconds',
      RedrivePolicy: 'redrivePolicy',
      VisibilityTimeout: 'visibilityTimeout?'
    },
    {
      DelaySeconds: 0,
      FifoQueue: false,
      KmsDataKeyReusePeriodSeconds: 300,
      KmsMasterKeyId: 'alias/aws/sqs',
      MaximumMessageSize: 262144,
      MessageRetentionPeriod: 345600,
      ReceiveMessageWaitTimeSeconds: 0,
      VisibilityTimeout: 30
    }
  ),
  QueueName: 'queueName',
  tags: 'object?'
});

const Message = struct({
  DelaySeconds: 'delaySeconds?',
  MessageBody: 'string', // TODO: add all validations
  QueueUrl: 'string' // TODO:  add all validations
});

module.exports = {
  Message,
  Queue
};
