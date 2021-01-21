'use strict';

jest.mock('../sqs');

const dedent = require('dedent');
const { createQueue } = require('../sqs');
const actionCreateQueue = require('./create-queue');
const { ErrorWithCode } = require('../utils/errors');

describe('create-queue', () => {
  beforeEach(() => jest.resetAllMocks());

  test('return created queue', () => {
    createQueue.mockImplementationOnce(() => 'http://localhost:3000/queues/core-test5');
    expect(
      actionCreateQueue(
        {
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
        },
        'localhost:3000'
      )
    ).toEqual(dedent`<?xml version="1.0"?>
    <CreateQueueResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <CreateQueueResult>
        <QueueUrl>http://localhost:3000/queues/core-test5</QueueUrl>
      </CreateQueueResult>
    </CreateQueueResponse>`);
    expect(createQueue).toHaveBeenCalledTimes(1);
    expect(createQueue).toHaveBeenNthCalledWith(
      1,
      {
        Attributes: {
          DelaySeconds: '20',
          MaximumMessageSize: '2000',
          MessageRetentionPeriod: '61',
          VisibilityTimeout: '3'
        },
        QueueName: 'core-test5',
        tags: {}
      },
      'localhost:3000'
    );
  });

  test('return created queue with FifoQueue set to "false"', () => {
    createQueue.mockImplementationOnce(() => 'http://localhost:3000/queues/foo-bar');
    expect(
      actionCreateQueue(
        {
          Action: 'CreateQueue',
          'Attribute.1.Name': 'FifoQueue',
          'Attribute.1.Value': 'false',
          QueueName: 'foo-bar',
          Version: '2012-11-05'
        },
        'localhost:3000'
      )
    ).toEqual(dedent`<?xml version="1.0"?>
    <CreateQueueResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <CreateQueueResult>
        <QueueUrl>http://localhost:3000/queues/foo-bar</QueueUrl>
      </CreateQueueResult>
    </CreateQueueResponse>`);
    expect(createQueue).toHaveBeenCalledTimes(1);
    expect(createQueue).toHaveBeenNthCalledWith(
      1,
      {
        Attributes: {
          FifoQueue: false
        },
        QueueName: 'foo-bar',
        tags: {}
      },
      'localhost:3000'
    );
  });

  test('return created queue with ContentBasedDeduplication set to "false"', () => {
    createQueue.mockImplementationOnce(() => 'http://localhost:3000/queues/foo-bar');
    const response = actionCreateQueue(
      {
        Action: 'CreateQueue',
        'Attribute.1.Name': 'ContentBasedDeduplication',
        'Attribute.1.Value': 'false',
        QueueName: 'foo-bar',
        Version: '2012-11-05'
      },
      'localhost:3000'
    );
    expect(response).toEqual(dedent`<?xml version="1.0"?>
    <CreateQueueResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <CreateQueueResult>
        <QueueUrl>http://localhost:3000/queues/foo-bar</QueueUrl>
      </CreateQueueResult>
    </CreateQueueResponse>`);
    expect(createQueue).toHaveBeenCalledTimes(1);
    expect(createQueue).toHaveBeenNthCalledWith(
      1,
      {
        Attributes: {
          ContentBasedDeduplication: false
        },
        QueueName: 'foo-bar',
        tags: {}
      },
      'localhost:3000'
    );
  });

  test('throw error when queue failed to create', () => {
    createQueue.mockImplementationOnce(() => {
      throw new ErrorWithCode('Mock Error', 'Mock code');
    });

    let error;
    try {
      actionCreateQueue(
        {
          Action: 'CreateQueue',
          QueueName: 'foo-bar',
          Version: '2012-11-05'
        },
        'localhost:3000'
      );
    } catch (err) {
      error = err;
    }

    expect(createQueue).toHaveBeenCalledTimes(1);
    expect(createQueue).toHaveBeenNthCalledWith(
      1,
      {
        Attributes: {},
        QueueName: 'foo-bar',
        tags: {}
      },
      'localhost:3000'
    );
    expect(error.message).toEqual('Mock Error');
    expect(error.xml).toEqual(dedent`
    <?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
        <Code>Mock code</Code>
        <Detail/>
        <Message>Mock Error</Message>
        <Type>Sender</Type>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>`);
  });

  test('create queue with tags', () => {
    createQueue.mockImplementationOnce(() => 'http://localhost:3000/queues/foo-bar');
    expect(
      actionCreateQueue(
        {
          Action: 'CreateQueue',
          QueueName: 'foo-bar',
          'Tag.1.Key': 'Foo',
          'Tag.1.Value': 'Bar',
          'Tag.2.Key': 'Baz',
          'Tag.2.Value': 'Bazz',
          Version: '2012-11-05'
        },
        'localhost:3000'
      )
    ).toEqual(dedent`<?xml version="1.0"?>
    <CreateQueueResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <CreateQueueResult>
        <QueueUrl>http://localhost:3000/queues/foo-bar</QueueUrl>
      </CreateQueueResult>
    </CreateQueueResponse>`);
    expect(createQueue).toHaveBeenCalledTimes(1);
    expect(createQueue).toHaveBeenNthCalledWith(
      1,
      {
        Attributes: {},
        QueueName: 'foo-bar',
        tags: {
          Baz: 'Bazz',
          Foo: 'Bar'
        }
      },
      'localhost:3000'
    );
  });

  test('create queue with redrive policy', () => {
    createQueue.mockImplementationOnce(() => 'http://localhost:3000/queues/foo-bar');
    expect(
      actionCreateQueue(
        {
          Action: 'CreateQueue',
          'Attribute.1.Name': 'RedrivePolicy',
          'Attribute.1.Value':
            '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue","maxReceiveCount":"1000"}',
          QueueName: 'foo-bar',
          Version: '2012-11-05'
        },
        'localhost:3000'
      )
    ).toEqual(dedent`<?xml version="1.0"?>
    <CreateQueueResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <CreateQueueResult>
        <QueueUrl>http://localhost:3000/queues/foo-bar</QueueUrl>
      </CreateQueueResult>
    </CreateQueueResponse>`);
    expect(createQueue).toHaveBeenCalledTimes(1);
    expect(createQueue).toHaveBeenNthCalledWith(
      1,
      {
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue',
            maxReceiveCount: '1000'
          }
        },
        QueueName: 'foo-bar',
        tags: {}
      },
      'localhost:3000'
    );
  });
});
