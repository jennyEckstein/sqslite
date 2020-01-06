'use strict';

jest.mock('../sqs');

const dedent = require('dedent');
const { createQueue } = require('../sqs');
const actionCreateQueue = require('./create-queue');

describe('create-queue', () => {
  test('return created queue', () => {
    const body = {
      Action: 'CreateQueue',
      'Attribute.1.Name': 'DelaySeconds',
      'Attribute.1.Value': '20',
      'Attribute.2.Name': 'MaximumMessageSize',
      'Attribute.2.Value': '2000',
      'Attribute.3.Name': 'MessageRetentionPeriod',
      'Attribute.3.Value': '61',
      'Attribute.4.Name': 'VisibilityTimeout',
      'Attribute.4.Value': '3',
      QueueName: 'core-test5',
      Version: '2012-11-05'
    };

    createQueue.mockImplementationOnce(() => 'https://queue.amazonaws.com/queues/core-test5');

    const expectedResponse = dedent`<?xml version="1.0"?>
    <CreateQueueResponse>
      <CreateQueueResult>
        <QueueUrl>https://queue.amazonaws.com/queues/core-test5</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </CreateQueueResponse>`;

    const response = actionCreateQueue(body);
    expect(response).toEqual(expectedResponse);
  });

  test('return created queue with FifoQueue set to "false"', () => {
    const body = {
      Action: 'CreateQueue',
      'Attribute.1.Name': 'FifoQueue',
      'Attribute.1.Value': 'false',
      QueueName: 'foo-bar',
      Version: '2012-11-05'
    };
    createQueue.mockImplementationOnce(() => 'https://queue.amazonaws.com/queues/foo-bar');

    const expectedResponse = dedent`<?xml version="1.0"?>
    <CreateQueueResponse>
      <CreateQueueResult>
        <QueueUrl>https://queue.amazonaws.com/queues/foo-bar</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </CreateQueueResponse>`;

    const response = actionCreateQueue(body);
    expect(response).toEqual(expectedResponse);
  });

  test('return created queue with ContentBasedDeduplication set to "false"', () => {
    const body = {
      Action: 'CreateQueue',
      'Attribute.1.Name': 'ContentBasedDeduplication',
      'Attribute.1.Value': 'false',
      QueueName: 'foo-bar',
      Version: '2012-11-05'
    };
    createQueue.mockImplementationOnce(() => 'https://queue.amazonaws.com/queues/foo-bar');

    const expectedResponse = dedent`<?xml version="1.0"?>
    <CreateQueueResponse>
      <CreateQueueResult>
        <QueueUrl>https://queue.amazonaws.com/queues/foo-bar</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </CreateQueueResponse>`;

    const response = actionCreateQueue(body);
    expect(response).toEqual(expectedResponse);
  });

  test('throw error when queue failed to create', () => {
    const body = {
      Action: 'CreateQueue',
      QueueName: 'foo-bar',
      Version: '2012-11-05'
    };
    createQueue.mockImplementationOnce(() => {
      throw Object.assign(new Error('Unknown Attribute ContentBasedDeduplication.'), {
        code: 'InvalidAttributeName'
      });
    });
    const expectedResponse = dedent`
    <?xml version="1.0"?>
    <ErrorResponse>
      <Error>
        <Code>InvalidAttributeName</Code>
        <Detail/>
        <Message>Unknown Attribute ContentBasedDeduplication.</Message>
        <Type>Sender</Type>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>`;

    let error;

    try {
      actionCreateQueue(body);
    } catch (err) {
      error = err;
    }

    expect(error.message).toEqual('Unknown Attribute ContentBasedDeduplication.');
    expect(error.xml).toEqual(expectedResponse);
  });
});
