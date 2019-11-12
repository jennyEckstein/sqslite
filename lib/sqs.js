'use strict';

const AWS_URL = 'https://queue.amazonaws.com/123/';

function validateQueueName(queueName, isFifo) {
  if (queueName.length > 80) {
    throw new Error('Queue name is too long. The queue name should not exceed 80 characters');
  }

  if (!/^[a-zA-Z0-9-_]*$/.test(queueName)) {
    throw new Error(
      'Queue name has invalid characters. Queue name should only consist of alphanumeric characters, hyphens (-), and underscores (_).'
    );
  }

  if (isFifo && !queueName.endsWith('.fifo')) {
    throw new Error("Queue name is incorrect. Fifo queues should end with '.fifo'.");
  }
}

function validateDelaySeconds(delaySeconds) {
  if (delaySeconds < 0 || delaySeconds > 900) {
    throw new Error(
      'Error creating queue. DelaySeconds must be an integer from 0 to 900 seconds (15 minutes). Default: 0.'
    );
  }
}

function validateMaximumMessageSize(maximumMessageSize) {
  if (maximumMessageSize < 1024 || maximumMessageSize > 262144) {
    throw new Error(
      'Error creating queue. MaximumMessageSize must be an integer from 1,024 bytes (1 KiB) to 262,144 bytes (256 KiB). Default: 262,144 (256 KiB)'
    );
  }
}

function validateMessageRetentionPeriod(messageRetentionPeriod) {
  if (messageRetentionPeriod < 60 || messageRetentionPeriod > 1209600) {
    throw new Error(
      'Error creating queue. MessageRetentionPeriod must be an integer from 60 seconds (1 minute) to 1,209,600 seconds (14 days). Default: 345,600 (4 days).'
    );
  }
}

function validateReceiveMessageWaitTimeSeconds(receiveMessageWaitTimeSeconds) {
  if (receiveMessageWaitTimeSeconds < 0 || receiveMessageWaitTimeSeconds > 20) {
    throw new Error(
      'Error creating queue. ReceiveMessageWaitTimeSeconds must be an integer from 0 to 20 (seconds). Default: 0.'
    );
  }
}

function validateVisibilityTimeout(visibilityTimeout) {
  if (visibilityTimeout < 0 || visibilityTimeout > 43200) {
    throw new Error(
      'Error creating queue. VisibilityTimeout must be an integer from 0 to 43,200 (12 hours). Default: 30.'
    );
  }
}

const queues = new Map();

function createQueue(params) {
  const { Attributes, QueueName } = params;
  const {
    DelaySeconds,
    FifoQueue,
    MaximumMessageSize,
    MessageRetentionPeriod,
    ReceiveMessageWaitTimeSeconds,
    VisibilityTimeout
  } = Attributes || {
    DelaySeconds: 0,
    FifoQueue: false,
    MaximumMessageSize: 262144,
    MessageRetentionPeriod: 345600,
    ReceiveMessageWaitTimeSeconds: 0,
    VisibilityTimeout: 30
  };

  validateQueueName(QueueName, FifoQueue);
  validateDelaySeconds(DelaySeconds);
  validateMaximumMessageSize(MaximumMessageSize);
  validateMessageRetentionPeriod(MessageRetentionPeriod);
  // TODO: Policy validation
  validateReceiveMessageWaitTimeSeconds(ReceiveMessageWaitTimeSeconds);
  // TODO: RedrivePolicy validation
  validateVisibilityTimeout(VisibilityTimeout);
  // TODO: KmsMasterKeyId validation
  // TODO: KmsDataKeyReusePeriodSeconds validation
  // TODO: ContentBasedDeduplication validation

  const queueUrl = `${AWS_URL}${QueueName}`;
  queues.set(queueUrl, {});

  return queues.get(queueUrl);
}

function listQueues() {
  const list = [];
  queues.forEach((value, key) => list.push(key));

  return { QueueUrl: list };
}

module.exports = {
  createQueue,
  listQueues
};
