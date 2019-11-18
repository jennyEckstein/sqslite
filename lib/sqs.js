'use strict';

const { Queue } = require('./utils/validations');

const AWS_URL = 'https://queue.amazonaws.com/123/';
const QUEUE_ARN = 'arn:aws:sqs:us-east-1:123:';

const queues = new Map();

function validateQueueName(queueName, isFifo) {
  if (isFifo && !queueName.endsWith('.fifo')) {
    throw new Error("Queue name is incorrect. Fifo queues should end with '.fifo'.");
  }
}

function validateDeadLetterQueue(deadLetterQueueArn, isFifo) {
  let foundArn;
  queues.forEach(value => {
    if (value.Attributes.QueueArn === deadLetterQueueArn) {
      foundArn = deadLetterQueueArn;
      if (value.Attributes.FifoQueue !== isFifo) {
        throw new Error(
          'Error creating queue. DeadLetterQueue has to be of the same type (fifo/not fifo) as the queue.'
        );
      }
    }
  });
  if (!foundArn) {
    throw new Error('Error creating queue. Dead letter queue does not exist');
  }
}

function validateNoContentBasedDeduplication(contentBasedDeduplication) {
  if (contentBasedDeduplication) {
    throw new Error(
      'Error creating queue. ContentBasedDeduplication could only be set for FIFO queue'
    );
  }
}

function createQueue(params) {
  const queueParams = Queue(params);

  const { Attributes, QueueName } = queueParams;
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
  const { deadLetterQueueArn } = RedrivePolicy || {};

  validateQueueName(QueueName, FifoQueue);
  if (!FifoQueue) {
    validateNoContentBasedDeduplication(ContentBasedDeduplication);
  }
  if (RedrivePolicy) {
    validateDeadLetterQueue(deadLetterQueueArn, FifoQueue);
  }

  // TODO: Policy validation
  // TODO: --cli-input-json
  // TODO: --generate-cli-skeleton

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
    Tags: queueParams.tags
  });

  return `
  <CreateQueueResponse>
  <CreateQueueResult>
  <QueueUrl>${queueUrl}</QueueUrl>
  </CreateQueueResult>
  <ResponseMetadata>
  <RequestId>7a62c49f-347e-4fc4-9331-6e8e7a96aa73</RequestId>
  </ResponseMetadata>
  </CreateQueueResponse>`;
}

function listQueues() {
  const list = [];
  queues.forEach((value, key) => list.push(key));

  return `<ListQueuesResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
  <ListQueuesResult>${list.map(i => `<QueueUrl>${i}</QueueUrl>`)}</ListQueuesResult>
  <ResponseMetadata>
    <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
  </ResponseMetadata>
</ListQueuesResponse>`;
}

module.exports = {
  createQueue,
  listQueues
};
