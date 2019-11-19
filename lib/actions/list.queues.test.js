'use strict';

jest.mock('../sqs');

const { listQueues } = require('../sqs');

const actionListQueues = require('./list-queues');

describe('list-queues', () => {
  test('return value from list queues', () => {
    listQueues.mockReturnValue({
      QueueUrls: ['https://queue.amazonaws.com/123/jenny-test5']
    });

    expect(actionListQueues()).toEqual({
      QueueUrls: ['https://queue.amazonaws.com/123/jenny-test5']
    });
  });
});
