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

    createQueue.mockReturnValue('https://queue.amazonaws.com/123/core-test5');

    const expectedResponse = dedent(`<CreateQueueResponse>
      <CreateQueueResult>
        <QueueUrl>https://queue.amazonaws.com/123/core-test5</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </CreateQueueResponse>`);

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
    createQueue.mockReturnValue('https://queue.amazonaws.com/123/foo-bar');

    const expectedResponse = dedent(`<CreateQueueResponse>
    <CreateQueueResult>
      <QueueUrl>https://queue.amazonaws.com/123/foo-bar</QueueUrl>
    </CreateQueueResult>
    <ResponseMetadata>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ResponseMetadata>
  </CreateQueueResponse>`);

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
    createQueue.mockReturnValue('https://queue.amazonaws.com/123/foo-bar');

    const expectedResponse = dedent(`<CreateQueueResponse>
    <CreateQueueResult>
      <QueueUrl>https://queue.amazonaws.com/123/foo-bar</QueueUrl>
    </CreateQueueResult>
    <ResponseMetadata>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ResponseMetadata>
  </CreateQueueResponse>`);

    const response = actionCreateQueue(body);
    expect(response).toEqual(expectedResponse);
  });
});
