'use strict';

const { Queue } = require('./utils/validations');

const AWS_URL = 'https://queue.amazonaws.com/123/';

function validateQueueName(queueName, isFifo) {
  if (isFifo && !queueName.endsWith('.fifo')) {
    throw new Error("Queue name is incorrect. Fifo queues should end with '.fifo'.");
  }
}

const queues = new Map();

function createQueue(params) {
  const queueParams = Queue(params);
  const { Attributes, QueueName } = queueParams;
  const {
    DelaySeconds,
    FifoQueue,
    MaximumMessageSize,
    MessageRetentionPeriod,
    ReceiveMessageWaitTimeSeconds,
    VisibilityTimeout
  } = Attributes;

  validateQueueName(QueueName, FifoQueue);

  // TODO: Policy validation
  // TODO: RedrivePolicy validation
  // TODO: KmsMasterKeyId validation
  // TODO: KmsDataKeyReusePeriodSeconds validation
  // TODO: ContentBasedDeduplication validation

  const queueUrl = `${AWS_URL}${QueueName}`;
  queues.set(queueUrl, {
    DelaySeconds,
    FifoQueue,
    MaximumMessageSize,
    MessageRetentionPeriod,
    ReceiveMessageWaitTimeSeconds,
    VisibilityTimeout
  });

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
