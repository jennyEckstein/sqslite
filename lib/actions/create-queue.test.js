'use strict';

jest.mock('../sqs');

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
      QueueName: 'jenny-test5',
      Version: '2012-11-05'
    };

    createQueue.mockReturnValue({
      QueueUrl: 'https://queue.amazonaws.com/123/jenny-test5'
    });

    const response = actionCreateQueue(body);
    expect(response).toEqual({
      QueueUrl: 'https://queue.amazonaws.com/123/jenny-test5'
    });
  });
});
