'use strict';

require('jest-xml-matcher');

const { clearQueues, createQueue, listQueues, sendMessage } = require('./sqs');

describe('sqs', () => {
  describe('createQueue', () => {
    afterEach(() => clearQueues());

    test('throw an error when queue name is too long', () => {
      const params = {
        QueueName:
          '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
      };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('successfully create queue', () => {
      const params = { QueueName: 'foo-bar' };
      const result = createQueue(params);
      expect(result).toEqual('https://queue.amazonaws.com/123/foo-bar');
    });

    test('throw an error when attempting to create fifo queue with no .fifo postfix', () => {
      const params = { Attributes: { FifoQueue: true }, QueueName: 'foo-bar' };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw an error when queue name has invalid characters', () => {
      const params = { QueueName: 'abc!@#' };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw error when DelaySeconds is invalid value', () => {
      const params = { Attributes: { DelaySeconds: '1000' }, QueueName: 'foo-bar' };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter DelaySeconds.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw error when MaximumMessageSize is invalid value', () => {
      const params = { Attributes: { MaximumMessageSize: 262145 }, QueueName: 'foo-bar' };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter MaximumMessageSize.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when MessageRetentionPeriod is invlid value', () => {
      const params = { Attributes: { MessageRetentionPeriod: 1209601 }, QueueName: 'foo-bar' };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter MessageRetentionPeriod.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when ReceiveMessageWaitTimeSeconds is invalid value', () => {
      const params = { Attributes: { ReceiveMessageWaitTimeSeconds: 21 }, QueueName: 'foo-bar' };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Invalid value for the parameter ReceiveMessageWaitTimeSeconds.'
      );
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when VisibilityTimeout is invlid value', () => {
      const params = { Attributes: { VisibilityTimeout: 43201 }, QueueName: 'foo-bar' };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter VisibilityTimeout.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when RedrivcePolicy missing deadLetterQueueArn', () => {
      const params = { Attributes: { RedrivePolicy: '{}' }, QueueName: 'foo-bar' };
      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw an error when RedrivePolicy missing maxReceiveCount', () => {
      const params = {
        Attributes: { RedrivePolicy: '{ "deadLetterQueueArn": "arn" }' },
        QueueName: 'foo-bar'
      };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw an error when deadLetterTargetArn does not exist', () => {
      const params = {
        Attributes: { RedrivePolicy: { deadLetterTargetArn: 'foo', maxReceiveCount: 10 } },
        QueueName: 'foo-bar'
      };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;deadLetterTargetArn&quot;:&quot;foo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throws an error when deadLetterQueue exists but does not much fifo/not fifo of the queue', () => {
      const deadLetterQueueParams = { QueueName: 'dead-letter-queue' };
      createQueue(deadLetterQueueParams);
      const params = {
        Attributes: {
          FifoQueue: true,
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue',
            maxReceiveCount: 5
          }
        },
        QueueName: 'foo-with-dlq.fifo'
      };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:123:dead-letter-queue&quot;,&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Dead-letter target owner should be same as the source.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw error when deadLetterTargerArd does not exist in list of queues', () => {
      const deadLetterQueueParams = {
        Attributes: { FifoQueue: true },
        QueueName: 'dead-letter-queue1.fifo'
      };
      createQueue(deadLetterQueueParams);
      const params = {
        Attributes: {
          FifoQueue: true,
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue2.fifo',
            maxReceiveCount: 5
          }
        },
        QueueName: 'foo-with-dlq.fifo'
      };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:123:dead-letter-queue2.fifo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.'
      );
    });

    test('throw error when attempting to create queue with existing name but different RedrivePolicy deadLettterTargetArn', () => {
      const deadLetterQueueParams1 = { QueueName: 'dead-letter-queue1' };
      const deadLetterQueueParams2 = { QueueName: 'dead-letter-queue2' };

      createQueue(deadLetterQueueParams1);
      createQueue(deadLetterQueueParams2);

      const queueParams1 = {
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue1',
            maxReceiveCount: '10'
          }
        },
        QueueName: 'foo-bar'
      };

      const queueParams2 = {
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue2',
            maxReceiveCount: '10'
          }
        },
        QueueName: 'foo-bar'
      };

      createQueue(queueParams1);
      expect(() => createQueue(queueParams2)).toThrow(
        'A queue already exists with the same name and a different value for attribute RedrivePolicy'
      );
    });

    test('throw error when attempting to create queue with existing name but different RedrivePolicy maxReceiveCount', () => {
      const deadLetterQueueParams1 = { QueueName: 'dead-letter-queue1' };

      createQueue(deadLetterQueueParams1);

      const queueParams1 = {
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue1',
            maxReceiveCount: '5'
          }
        },
        QueueName: 'foo-bar'
      };

      const queueParams2 = {
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue1',
            maxReceiveCount: '10'
          }
        },
        QueueName: 'foo-bar'
      };

      createQueue(queueParams1);
      expect(() => createQueue(queueParams2)).toThrow(
        'A queue already exists with the same name and a different value for attribute RedrivePolicy'
      );
    });

    test('create queue with the same name and identical RedrivePolicy', () => {
      const deadLetterQueueParams1 = { QueueName: 'dead-letter-queue1' };

      createQueue(deadLetterQueueParams1);

      const queueParams1 = {
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue1',
            maxReceiveCount: '10'
          }
        },
        QueueName: 'foo-bar'
      };

      const queueParams2 = {
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue1',
            maxReceiveCount: '10'
          }
        },
        QueueName: 'foo-bar'
      };

      createQueue(queueParams1);
      expect(createQueue(queueParams2)).toEqual('https://queue.amazonaws.com/123/foo-bar');
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
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123:dead-letter-queue1.fifo',
            maxReceiveCount: 5
          }
        },
        QueueName: 'foo-with-dlq.fifo'
      };
      const response = createQueue(params);
      expect(response).toEqual('https://queue.amazonaws.com/123/foo-with-dlq.fifo');
    });

    test('throw error when KmsMasterKeyId is not set correctly', () => {
      const params = { Attributes: { KmsMasterKeyId: 'foo' }, QueueName: 'foo-bar12' };
      const response = createQueue(params);
      expect(response).toEqual('https://queue.amazonaws.com/123/foo-bar12');
    });

    test('throw error when KmsDataKeyReusePeriodSeconds is not set correctly', () => {
      const params = { Attributes: { KmsDataKeyReusePeriodSeconds: 86401 }, QueueName: 'foo-bar' };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Invalid value for the parameter KmsDataKeyReusePeriodSeconds.'
      );
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw error when attempting to set ContentBasedDeduplication, with a non FIFO queue', () => {
      const params = { Attributes: { ContentBasedDeduplication: true }, QueueName: 'foo-bar' };

      let error;
      try {
        createQueue(params);
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Unknown Attribute ContentBasedDeduplication.');
    });

    test('successfully create queue with tags', () => {
      const params = { QueueName: 'foo-bar-with-tags', tags: { foo: 'bar' } };
      const result = createQueue(params);
      expect(result).toEqual('https://queue.amazonaws.com/123/foo-bar-with-tags');
    });

    test('-- error when trying to create duplicate queue with different params', () => {
      const params = { Attributes: { DelaySeconds: 100 }, QueueName: 'test-duplicate' };
      createQueue(params);

      const params1 = {
        Attributes: { DelaySeconds: 100, VisibilityTimeout: 500 },
        QueueName: 'test-duplicate'
      };

      let error;
      try {
        createQueue(params1);
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'A queue already exists with the same name and a different value for attribute VisibilityTimeout'
      );
    });
  });

  describe('listQueues', () => {
    test('list all queues when list is empty', () => {
      const listOfQueues = listQueues();
      expect(listOfQueues).toEqual([]);
    });

    test('list all queues when list has queues', () => {
      const params1 = { QueueName: 'foo-bar1' };
      const params2 = { QueueName: 'foo-bar2' };

      createQueue(params1);
      createQueue(params2);
      const listOfQueues = listQueues();

      expect(listOfQueues).toEqual([
        'https://queue.amazonaws.com/123/foo-bar1',
        'https://queue.amazonaws.com/123/foo-bar2'
      ]);
    });
  });

  describe('sendMessage', () => {
    test('throw error when queue does not exist', () => {
      let error;
      try {
        sendMessage({ QueueUrl: 'foo' });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
      expect(error.code).toEqual('AWS.SimpleQueueService.NonExistentQueue');
    });

    test('successfully send message when queue has no messages', () => {
      createQueue({ QueueName: 'foo-bar' });
      const params = {
        MessageBody: 'some message',
        QueueUrl: 'https://queue.amazonaws.com/123/foo-bar'
      };
      const response = sendMessage(params);
      expect(response).toEqual({
        MD5OfMessageBody: 'df49b60423903e095b80d9b4a92eb065',
        MessageId: expect.any(String)
      });
    });

    test('successfully send message when queue has messages', () => {
      createQueue({ QueueName: 'foo-bar' });
      const params1 = {
        MessageBody: 'first message',
        QueueUrl: 'https://queue.amazonaws.com/123/foo-bar'
      };
      const params2 = {
        MessageBody: 'second message',
        QueueUrl: 'https://queue.amazonaws.com/123/foo-bar'
      };

      sendMessage(params1);
      const response = sendMessage(params2);
      expect(response).toEqual({
        MD5OfMessageBody: 'bf48a9b23ca5015653edebff31d6b879',
        MessageId: expect.any(String)
      });
    });
  });
});
