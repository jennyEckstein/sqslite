'use strict';

const { superstruct } = require('superstruct');

const struct = superstruct({
  types: {
    delayseconds: delaySeconds => {
      if (delaySeconds < 0 || delaySeconds > 900) {
        throw new Error(
          'Error creating queue. DelaySeconds must be an integer from 0 to 900 seconds (15 minutes). Default: 0.'
        );
      }
      return true;
    },
    kmsDataKeyReusePeriodSeconds: kmsDataKeyReusePeriodSeconds => {
      if (kmsDataKeyReusePeriodSeconds < 60 || kmsDataKeyReusePeriodSeconds > 86400) {
        throw new Error(
          'Error creating queue, KmsDataKeyReusePeriodSeconds must be an integer representing seconds, between 60 seconds (1 minute) and 86,400 seconds (24 hours)'
        );
      }
      return true;
    },
    kmsMasterKeyId: kmsMasterKeyId => {
      if (!/^alias\/.*$/.test(kmsMasterKeyId)) {
        throw new Error('Error creating queue. KmsMasterKeyId must begin with "alias/"');
      }
      return true;
    },
    maximummessagesize: maximumMessageSize => {
      if (maximumMessageSize < 1024 || maximumMessageSize > 262144) {
        throw new Error(
          'Error creating queue. MaximumMessageSize must be an integer from 1,024 bytes (1 KiB) to 262,144 bytes (256 KiB). Default: 262,144 (256 KiB)'
        );
      }
      return true;
    },
    messageRetentionPeriod: messageRetentionPeriod => {
      if (messageRetentionPeriod < 60 || messageRetentionPeriod > 1209600) {
        throw new Error(
          'Error creating queue. MessageRetentionPeriod must be an integer from 60 seconds (1 minute) to 1,209,600 seconds (14 days). Default: 345,600 (4 days).'
        );
      }
      return true;
    },
    queuename: queueName => {
      if (queueName.length > 80) {
        throw new Error('Queue name is too long. The queue name should not exceed 80 characters');
      }

      if (!/^[a-zA-Z0-9-_]*\.fifo$|^[a-zA-Z0-9-_]*$/.test(queueName)) {
        throw new Error(
          'Queue name has invalid characters. Queue name should only consist of alphanumeric characters, hyphens (-), and underscores (_).'
        );
      }
      return true;
    },
    receiveMessageWaitTimeSeconds: receiveMessageWaitTimeSeconds => {
      if (receiveMessageWaitTimeSeconds < 0 || receiveMessageWaitTimeSeconds > 20) {
        throw new Error(
          'Error creating queue. ReceiveMessageWaitTimeSeconds must be an integer from 0 to 20 (seconds). Default: 0.'
        );
      }
      return true;
    },
    redrivePolicy: redrivePolicy => {
      if (!redrivePolicy) return true;
      if (redrivePolicy && !redrivePolicy.deadLetterQueueArn) {
        throw new Error('Error creating queue. Redrive policy missing deadLetterQueueArn');
      }

      if (redrivePolicy && !redrivePolicy.maxReceiveCount) {
        throw new Error('Error creating queue. Redrive policy missing maxReceiveCount');
      }

      return true;
    },
    visibilityTimeout: visibilityTimeout => {
      if (visibilityTimeout < 0 || visibilityTimeout > 43200) {
        throw new Error(
          'Error creating queue. VisibilityTimeout must be an integer from 0 to 43,200 (12 hours). Default: 30.'
        );
      }
      return true;
    }
  }
});

const Queue = struct({
  Attributes: struct(
    {
      ContentBasedDeduplication: 'boolean',
      DelaySeconds: 'delayseconds',
      FifoQueue: 'boolean',
      KmsDataKeyReusePeriodSeconds: 'kmsDataKeyReusePeriodSeconds',
      KmsMasterKeyId: 'kmsMasterKeyId',
      MaximumMessageSize: 'maximummessagesize',
      MessageRetentionPeriod: 'messageRetentionPeriod',
      ReceiveMessageWaitTimeSeconds: 'receiveMessageWaitTimeSeconds',
      RedrivePolicy: 'redrivePolicy',
      VisibilityTimeout: 'visibilityTimeout?'
    },
    {
      ContentBasedDeduplication: false, // TODO: verify correct default value
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
  QueueName: 'queuename',
  tags: 'object?'
});

module.exports = {
  Queue
};
