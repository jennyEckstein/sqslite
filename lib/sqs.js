'use strict';

const { Queue } = require('./utils/validations');

const AWS_URL = 'https://queue.amazonaws.com/123/';
const QUEUE_ARN = 'arn:aws:sqs:us-east-1:123:';

const queues = new Map();

function validateQueueName(queueName, isFifo) {
  if (isFifo && !queueName.endsWith('.fifo')) {
    const err = new Error(
      'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.'
    );
    throw Object.assign(err, {
      xml: `<?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <Error>
    <Type>Sender</Type>
    <Code>InvalidParameterValue</Code>
    <Message>The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.</Message>
    <Detail/>
    </Error>
    <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>
    `
    });
  }
}

function validateDeadLetterQueue(deadLetterQueueArn, isFifo) {
  let foundArn;

  queues.forEach(value => {
    if (value.Attributes.QueueArn === deadLetterQueueArn) {
      foundArn = deadLetterQueueArn;
      if (value.Attributes.FifoQueue !== isFifo) {
        const err = new Error(
          'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:144505630525:foo-bar.fifo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead-letter queue must be same type of queue as the source.'
        );
        const xml = `<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidParameterValue</Code>
        <Message>Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:144505630525:foo-bar.fifo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead-letter queue must be same type of queue as the source.</Message>
        <Detail/>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ErrorResponse>`;
        throw Object.assign(err, { xml });
      }
    }
  });
  if (!foundArn) {
    const err = new Error(
      'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:144505630525:foo-bar-foo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.'
    );
    const xml = `<?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <Error>
    <Type>Sender</Type>
    <Code>InvalidParameterValue</Code>
    <Message>Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:144505630525:foo-bar-foo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.</Message>
    <Detail/>
    </Error>
    <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>`;
    throw Object.assign(err, { xml });
  }
}

function validateNoContentBasedDeduplication(contentBasedDeduplication) {
  if (contentBasedDeduplication) {
    const err = new Error('Unknown Attribute ContentBasedDeduplication.');
    const xml = `<?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <Error>
    <Type>Sender</Type>
    <Code>InvalidAttributeName</Code>
    <Message>Unknown Attribute ContentBasedDeduplication.</Message>
    <Detail/>
    </Error>
    <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>`;
    throw Object.assign(err, { xml });
  }
}

function queueAlreadyExists(queueName, attributes) {
  const queueWithSameName = queues.get(`${AWS_URL}${queueName}`);
  if (queueWithSameName) {
    // TODO: check if FifoQueue returns an error or if its considered different queue
    // TODO: check if different Redrive Policy makes queue different
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

    for (let i = 0; i < compareAttributes.length; i += 1) {
      if (
        queueWithSameName.Attributes[compareAttributes[i]] &&
        attributes[compareAttributes[i]] &&
        queueWithSameName.Attributes[compareAttributes[i]] !== attributes[compareAttributes[i]]
      ) {
        const err = new Error(
          `A queue already exists with the same name and a different value for attribute ${compareAttributes[i]}`
        );
        const xml = `<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>QueueAlreadyExists</Code>
        <Message>A queue already exists with the same name and a different value for attribute ${compareAttributes[i]}</Message>
        <Detail/>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;
        throw Object.assign(err, { xml });
      }
    }
  }
}

function debugQueues() {
  // console.log('Queues:', queues);
}

function clearQueues() {
  queues.clear();
}

// TODO: Add clear all funcrion for unit/testing

// TODO: when delete-queue functionality implemented, need to add check for QueueDeletedRecently error
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

module.exports.debug = {
  clearQueues,
  listQueues
};
