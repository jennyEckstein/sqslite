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
        Attributes: {
          ContentBasedDeduplication: false,
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:123:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          VisibilityTimeout: 30
        }
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

    test('throw an error when RedrivcePolicy missing deadLetterQueueArn', () => {
      const params = {
        Attributes: {
          RedrivePolicy: {}
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue. Redrive policy missing deadLetterQueueArn'
      );
    });

    test('throw an error when RedrivePolicy missing maxReceiveCount', () => {
      const params = {
        Attributes: {
          RedrivePolicy: {
            deadLetterQueueArn: 'arn'
          }
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue. Redrive policy missing maxReceiveCount'
      );
    });

    test('throw an error when deadLetterQueueArn does not exist', () => {
      const params = {
        Attributes: {
          RedrivePolicy: { deadLetterQueueArn: 'foo', maxReceiveCount: 10 }
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue. Dead letter queue does not exist'
      );
    });

    test('throws an error when deadLetterQueue exists but does not much fifo/not fifo of the queue', () => {
      const deadLetterQueueParams = {
        QueueName: 'dead-letter-queue'
      };
      createQueue(deadLetterQueueParams);
      const params = {
        Attributes: {
          FifoQueue: true,
          RedrivePolicy: {
            deadLetterQueueArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue',
            maxReceiveCount: 5
          }
        },
        QueueName: 'foo-with-dlq.fifo'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue. DeadLetterQueue has to be of the same type (fifo/not fifo) as the queue.'
      );
    });

    test('successfully set redrive policy', () => {
      const deadLetterQueueParams = {
        Attributes: { FifoQueue: true },
        QueueName: 'dead-letter-queue1.fifo'
      };
      createQueue(deadLetterQueueParams);
      const params = {
        Attributes: {
          FifoQueue: true,
          RedrivePolicy: {
            deadLetterQueueArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue1.fifo',
            maxReceiveCount: 5
          }
        },
        QueueName: 'foo-with-dlq.fifo'
      };
      const response = createQueue(params);
      // TODO: why not returning default values
      expect(response).toEqual({
        Attributes: {
          DelaySeconds: undefined,
          FifoQueue: true,
          MaximumMessageSize: undefined,
          MessageRetentionPeriod: undefined,
          QueueArn: 'arn:aws:sqs:us-east-1:123:foo-with-dlq.fifo',
          ReceiveMessageWaitTimeSeconds: undefined,
          RedrivePolicy: {
            deadLetterQueueArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue1.fifo',
            maxReceiveCount: 5
          },
          VisibilityTimeout: undefined
        }
      });
    });

    test('throw error when KmsMasterKeyId is not set correctly', () => {
      const params = {
        Attributes: {
          KmsMasterKeyId: 'foo'
        },
        QueueName: 'foo-bar'
      };

      expect(() => createQueue(params)).toThrow(
        'Error creating queue. KmsMasterKeyId must begin with "alias/"'
      );
    });

    test('throw error when KmsDataKeyReusePeriodSeconds is not set correctly', () => {
      const params = {
        Attributes: {
          KmsDataKeyReusePeriodSeconds: 86401
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue, KmsDataKeyReusePeriodSeconds must be an integer representing seconds, between 60 seconds (1 minute) and 86,400 seconds (24 hours)'
      );
    });

    test('throw error when is not boolean', () => {
      const params = {
        Attributes: {
          ContentBasedDeduplication: 'foo'
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Expected a value of type `boolean | undefined` for `Attributes.ContentBasedDeduplication` but received `"foo"`.'
      );
    });

    test('throw error when attempting to set ContentBasedDeduplication, with a non FIFO queue', () => {
      const params = {
        Attributes: {
          ContentBasedDeduplication: true
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Error creating queue. ContentBasedDeduplication could only be set for FIFO queue'
      );
    });

    test('successfully create queue with tags', () => {
      const params = {
        QueueName: 'foo-bar-with-tags',
        tags: {
          foo: 'bar'
        }
      };
      const result = createQueue(params);
      expect(result).toEqual({
        Attributes: {
          ContentBasedDeduplication: false,
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:123:foo-bar-with-tags',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        Tags: { foo: 'bar' }
      });
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
