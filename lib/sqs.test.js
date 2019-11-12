'use strict';

const { createQueue, listQueues } = require('./sqs');

describe('sqs', () => {
  describe('createQueue', () => {
    test('throw an error when queue name is too long', () => {
      const params = {
        QueueName:
          '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
      };
      expect(() => createQueue(params)).toThrow(
        'Queue name is too long. The queue name should not exceed 80 characters'
      );
    });

    test('successfully create queue', () => {
      const params = {
        QueueName: 'foo-bar'
      };
      const result = createQueue(params);
      expect(result).toEqual({
        DelaySeconds: 0,
        FifoQueue: false,
        MaximumMessageSize: 262144,
        MessageRetentionPeriod: 345600,
        ReceiveMessageWaitTimeSeconds: 0,
        VisibilityTimeout: 30
      });
    });

    test('throw an error when attempting to create fifo queue with no .fifo postfix', () => {
      const params = {
        Attributes: {
          FifoQueue: true
        },
        QueueName: 'foo-bar'
      };

      expect(() => createQueue(params)).toThrow(
        "Queue name is incorrect. Fifo queues should end with '.fifo'."
      );
    });

    test('throw an error when queue name has invalid characters', () => {
      const params = {
        QueueName: 'abc!@#'
      };
      expect(() => createQueue(params)).toThrow(
        'Queue name has invalid characters. Queue name should only consist of alphanumeric characters, hyphens (-), and underscores (_).'
      );
    });

    test('throw error when DelaySeconds is invalid value', () => {
      const params = {
        Attributes: {
          DelaySeconds: 1000
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue. DelaySeconds must be an integer from 0 to 900 seconds (15 minutes). Default: 0.'
      );
    });

    test('throw error when MaximumMessageSize is invalid value', () => {
      const params = {
        Attributes: {
          MaximumMessageSize: 262145
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue. MaximumMessageSize must be an integer from 1,024 bytes (1 KiB) to 262,144 bytes (256 KiB). Default: 262,144 (256 KiB)'
      );
    });

    test('throw an error when MessageRetentionPeriod is invlid value', () => {
      const params = {
        Attributes: {
          MessageRetentionPeriod: 12096001
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue. MessageRetentionPeriod must be an integer from 60 seconds (1 minute) to 1,209,600 seconds (14 days). Default: 345,600 (4 days).'
      );
    });

    test('throw an error when ReceiveMessageWaitTimeSeconds is invalid value', () => {
      const params = {
        Attributes: {
          ReceiveMessageWaitTimeSeconds: 21
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue. ReceiveMessageWaitTimeSeconds must be an integer from 0 to 20 (seconds). Default: 0.'
      );
    });

    test('throw an error when VisibilityTimeout is invlid value', () => {
      const params = {
        Attributes: {
          VisibilityTimeout: 43201
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue. VisibilityTimeout must be an integer from 0 to 43,200 (12 hours). Default: 30.'
      );
    });
  });

  describe('listQueues', () => {
    test('list all available queues', () => {
      const listOfQueues = listQueues();

      expect(listOfQueues.QueueUrl).toEqual(expect.any(Array));
      expect(listOfQueues.QueueUrl[0]).toEqual('https://queue.amazonaws.com/123/foo-bar');
    });
  });
});
