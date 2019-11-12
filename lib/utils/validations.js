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

      if (!/^[a-zA-Z0-9-_]*$/.test(queueName)) {
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

const Queue = struct(
  {
    Attributes: {
      DelaySeconds: 'delayseconds?',
      FifoQueue: 'boolean?',
      MaximumMessageSize: 'maximummessagesize?',
      MessageRetentionPeriod: 'messageRetentionPeriod?',
      ReceiveMessageWaitTimeSeconds: 'receiveMessageWaitTimeSeconds?',
      VisibilityTimeout: 'visibilityTimeout?'
    },
    QueueName: 'queuename'
  },
  {
    Attributes: {
      DelaySeconds: 0,
      FifoQueue: false,
      MaximumMessageSize: 262144,
      MessageRetentionPeriod: 345600,
      ReceiveMessageWaitTimeSeconds: 0,
      VisibilityTimeout: 30
    }
  }
);

module.exports = {
  Queue
};
