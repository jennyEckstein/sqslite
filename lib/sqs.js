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

function queueAlreadyExists(queueName, attributes) {
  const queueWithSameName = queues.get(`${AWS_URL}${queueName}`);
  if (queueWithSameName) {
    // TODO: check if FifoQueue returns an error or if its considered different queue
    // TODO: Redrive Policy
    const compareAttributes = [
      'ContentBasedDeduplication',
      'DelaySeconds',
      'KmsDataKeyReusePeriodSeconds',
      'KmsMasterKeyId',
      'MaximumMessageSize',
      'MessageRetentionPeriod',
      'ReceiveMessageWaitTimeSeconds',
      'RedrivePolicy',
      'VisibilityTimeout'
    ];

    for (let i = 0; i < compareAttributes.length; i += 1) {
      if (
        queueWithSameName.Attributes[compareAttributes[i]] &&
        attributes[compareAttributes[i]] &&
        queueWithSameName.Attributes[compareAttributes[i]] !== attributes[compareAttributes[i]]
      ) {
        throw new Error(`<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>QueueAlreadyExists</Code>
        <Message>A queue already exists with the same name and a different value for attribute ${compareAttributes[i]}</Message>
        <Detail/>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`);
      }
    }
  }
}

function debugQueues() {
  console.log('Queues:', queues);
}

// TODO: when delete-queue functionality implemented, need to add check for QueueDeletedRecently error
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
    Tags: queueParams.tags
  });

  debugQueues();

  return `
  <CreateQueueResponse>
  <CreateQueueResult>
  <QueueUrl>${queueUrl}</QueueUrl>
  </CreateQueueResult>
  <ResponseMetadata>
  <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
  </ResponseMetadata>
  </CreateQueueResponse>`;
}

function listQueues() {
  const list = [];
  queues.forEach((value, key) => list.push(key));
  debugQueues();

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
