'use strict';

const {
  clearQueues,
  createQueue,
  deleteMessage,
  getQueueState,
  listQueues,
  receiveMessage,
  sendMessage,
  sendMessageBatch,
  tagQueue,
  untagQueue
} = require('./sqs');

describe('sqs', () => {
  describe('createQueue', () => {
    afterEach(() => clearQueues());

    test('throw an error when queue name is too long', () => {
      let error;
      try {
        createQueue({
          QueueName:
            '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
        });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('successfully create queue', () => {
      expect(createQueue({ QueueName: 'foo-bar' })).toEqual('foo-bar');
    });

    test('throw an error when attempting to create fifo queue with no .fifo postfix', () => {
      let error;
      try {
        createQueue({ Attributes: { FifoQueue: true }, QueueName: 'foo-bar' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw an error when queue name has invalid characters', () => {
      let error;
      try {
        createQueue({ QueueName: 'abc!@#' });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw error when DelaySeconds is invalid value', () => {
      let error;
      try {
        createQueue({ Attributes: { DelaySeconds: '1000' }, QueueName: 'foo-bar' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter DelaySeconds.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw error when MaximumMessageSize is invalid value', () => {
      let error;
      try {
        createQueue({ Attributes: { MaximumMessageSize: 262145 }, QueueName: 'foo-bar' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter MaximumMessageSize.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when MessageRetentionPeriod is invlid value', () => {
      let error;
      try {
        createQueue({ Attributes: { MessageRetentionPeriod: 1209601 }, QueueName: 'foo-bar' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter MessageRetentionPeriod.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when ReceiveMessageWaitTimeSeconds is invalid value', () => {
      let error;
      try {
        createQueue({ Attributes: { ReceiveMessageWaitTimeSeconds: 21 }, QueueName: 'foo-bar' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Invalid value for the parameter ReceiveMessageWaitTimeSeconds.'
      );
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when VisibilityTimeout is invlid value', () => {
      let error;
      try {
        createQueue({ Attributes: { VisibilityTimeout: 43201 }, QueueName: 'foo-bar' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter VisibilityTimeout.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when RedrivcePolicy missing deadLetterQueueArn', () => {
      let error;
      try {
        createQueue({ Attributes: { RedrivePolicy: '{}' }, QueueName: 'foo-bar' });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw an error when RedrivePolicy missing maxReceiveCount', () => {
      let error;
      try {
        createQueue({
          Attributes: { RedrivePolicy: '{ "deadLetterQueueArn": "arn" }' },
          QueueName: 'foo-bar'
        });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw an error when deadLetterTargetArn does not exist', () => {
      let error;
      try {
        createQueue({
          Attributes: { RedrivePolicy: { deadLetterTargetArn: 'foo', maxReceiveCount: 10 } },
          QueueName: 'foo-bar'
        });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;deadLetterTargetArn&quot;:&quot;foo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throws an error when deadLetterQueue exists but does not much fifo/not fifo of the queue', () => {
      createQueue({ QueueName: 'dead-letter-queue' });

      let error;
      try {
        createQueue({
          Attributes: {
            FifoQueue: true,
            RedrivePolicy: {
              deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue',
              maxReceiveCount: 5
            }
          },
          QueueName: 'foo-with-dlq.fifo'
        });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:queues:dead-letter-queue&quot;,&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Dead-letter target owner should be same as the source.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw error when deadLetterTargerArd does not exist in list of queues', () => {
      createQueue({
        Attributes: { FifoQueue: true },
        QueueName: 'dead-letter-queue1.fifo'
      });

      let error;
      try {
        createQueue({
          Attributes: {
            FifoQueue: true,
            RedrivePolicy: {
              deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue2.fifo',
              maxReceiveCount: 5
            }
          },
          QueueName: 'foo-with-dlq.fifo'
        });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:queues:dead-letter-queue2.fifo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.'
      );
    });

    test('throw error when attempting to create queue with existing name but different RedrivePolicy deadLettterTargetArn', () => {
      createQueue({ QueueName: 'dead-letter-queue1' });
      createQueue({ QueueName: 'dead-letter-queue2' });
      createQueue({
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1',
            maxReceiveCount: '10'
          }
        },
        QueueName: 'foo-bar'
      });
      expect(() =>
        createQueue({
          Attributes: {
            RedrivePolicy: {
              deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue2',
              maxReceiveCount: '10'
            }
          },
          QueueName: 'foo-bar'
        })
      ).toThrow(
        'A queue already exists with the same name and a different value for attribute RedrivePolicy'
      );
    });

    test('throw error when attempting to create queue with existing name but different RedrivePolicy maxReceiveCount', () => {
      createQueue({ QueueName: 'dead-letter-queue1' });
      createQueue({
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1',
            maxReceiveCount: '5'
          }
        },
        QueueName: 'foo-bar'
      });
      expect(() =>
        createQueue({
          Attributes: {
            RedrivePolicy: {
              deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1',
              maxReceiveCount: '10'
            }
          },
          QueueName: 'foo-bar'
        })
      ).toThrow(
        'A queue already exists with the same name and a different value for attribute RedrivePolicy'
      );
    });

    test('create queue with the same name and identical RedrivePolicy', () => {
      createQueue({ QueueName: 'dead-letter-queue1' });
      createQueue({
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1',
            maxReceiveCount: '10'
          }
        },
        QueueName: 'foo-bar'
      });
      expect(
        createQueue({
          Attributes: {
            RedrivePolicy: {
              deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1',
              maxReceiveCount: '10'
            }
          },
          QueueName: 'foo-bar'
        })
      ).toEqual('foo-bar');
    });

    test('successfully set redrive policy', () => {
      createQueue({
        Attributes: { FifoQueue: true },
        QueueName: 'dead-letter-queue1.fifo'
      });
      expect(
        createQueue({
          Attributes: {
            FifoQueue: true,
            RedrivePolicy: {
              deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1.fifo',
              maxReceiveCount: 5
            }
          },
          QueueName: 'foo-with-dlq.fifo'
        })
      ).toEqual('foo-with-dlq.fifo');
    });

    test('throw error when KmsMasterKeyId is not set correctly', () => {
      expect(
        createQueue({ Attributes: { KmsMasterKeyId: 'foo' }, QueueName: 'foo-bar12' })
      ).toEqual('foo-bar12');
    });

    test('throw error when KmsDataKeyReusePeriodSeconds is not set correctly', () => {
      let error;
      try {
        createQueue({ Attributes: { KmsDataKeyReusePeriodSeconds: 86401 }, QueueName: 'foo-bar' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Invalid value for the parameter KmsDataKeyReusePeriodSeconds.'
      );
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw error when attempting to set ContentBasedDeduplication, with a non FIFO queue', () => {
      let error;
      try {
        createQueue({ Attributes: { ContentBasedDeduplication: true }, QueueName: 'foo-bar' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Unknown Attribute ContentBasedDeduplication.');
    });

    test('successfully create queue with tags', () => {
      expect(createQueue({ QueueName: 'foo-bar-with-tags', tags: { foo: 'bar' } })).toEqual(
        'foo-bar-with-tags'
      );
    });

    test('error when trying to create duplicate queue with different params', () => {
      createQueue({ Attributes: { DelaySeconds: 100 }, QueueName: 'test-duplicate' });

      let error;
      try {
        createQueue({
          Attributes: { DelaySeconds: 100, VisibilityTimeout: 500 },
          QueueName: 'test-duplicate'
        });
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
      expect(listQueues()).toEqual([]);
    });

    test('list all queues when list has queues', () => {
      createQueue({ QueueName: 'foo-bar1' });
      createQueue({ QueueName: 'foo-bar2' });
      expect(listQueues()).toEqual(['foo-bar1', 'foo-bar2']);
    });
  });

  describe('sendMessage', () => {
    test('throw error when queue does not exist', () => {
      let error;
      try {
        sendMessage({ QueueUrl: 'http://localhost:3000/queues/foo' });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
      expect(error.code).toEqual('AWS.SimpleQueueService.NonExistentQueue');
    });

    test('successfully send message when queue has no messages', () => {
      createQueue({ QueueName: 'foo-bar' });
      expect(
        sendMessage({
          MessageBody: 'some message',
          QueueUrl: 'http://localhost:3000/queues/foo-bar'
        })
      ).toEqual({
        MD5OfMessageBody: expect.any(String),
        MessageId: expect.any(String)
      });
    });

    test('successfully send message when queue has messages', () => {
      createQueue({ QueueName: 'foo-bar' });
      sendMessage({
        MessageBody: 'first message',
        QueueUrl: 'http://localhost:3000/queues/foo-bar'
      });
      expect(
        sendMessage({
          MessageBody: 'second message',
          QueueUrl: 'http://localhost:3000/queues/foo-bar'
        })
      ).toEqual({
        MD5OfMessageBody: expect.any(String),
        MessageId: expect.any(String)
      });
    });

    describe('MessageAttributes', () => {
      test('send message', () => {
        expect(
          sendMessage({
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryValue: 'Hello, World!',
                DataType: 'Binary'
              }
            },
            MessageBody: 'foo',
            MessageGroupId: '1111',
            QueueUrl: 'http://localhost:0000/queues/foo-bar'
          })
        ).toEqual({
          MD5OfMessageAttributes: '3449c9e5e332f1dbb81505cd739fbf3f',
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String)
        });
      });
    });

    describe('MessageSystemAttributes', () => {
      test('send message', () => {
        expect(
          sendMessage({
            MessageBody: 'foo',
            MessageGroupId: '1111',
            MessageSystemAttributes: {
              AWSTraceHeader: {
                DataType: 'String',
                StringValue: 'Foo=bar&baz=qux'
              }
            },
            QueueUrl: 'http://localhost:0000/queues/foo-bar'
          })
        ).toEqual({
          MD5OfMessageBody: expect.any(String),
          MD5OfMessageSystemAttributes: '3449c9e5e332f1dbb81505cd739fbf3f',
          MessageId: expect.any(String)
        });
      });
    });

    describe('DelaySeconds', () => {
      test('set custom DelaySeconds attribute for message', () => {
        createQueue({ QueueName: 'foo-bar' });
        expect(
          sendMessage({
            DelaySeconds: 20,
            MessageBody: 'foo',
            QueueUrl: 'http://localhost:3000/queues/foo-bar'
          })
        ).toEqual({
          DelaySeconds: 20,
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String)
        });
      });

      test('dont set DelaySeconds attribute for message when not passed explicitly, but set on creation', () => {
        createQueue({ Attributes: { DelaySeconds: 30 }, QueueName: 'foo-bar' });
        expect(
          sendMessage({
            MessageBody: 'foo',
            QueueUrl: 'http://localhost:3000/queues/foo-bar'
          })
        ).toEqual({
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String)
        });
      });

      test('set custom DelaySeconds attribute for message for Fifo queue', () => {
        createQueue({
          Attributes: { ContentBasedDeduplication: true, DelaySeconds: 200, FifoQueue: true },
          QueueName: 'foo-bar.fifo'
        });
        expect(
          sendMessage({
            MessageBody: 'foo',
            MessageGroupId: '111',
            QueueUrl: 'foo-bar.fifo'
          })
        ).toEqual({
          DelaySeconds: 200,
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String)
        });
      });

      test('set default DelaySeconds attribute for message for Fifo queue', () => {
        createQueue({
          Attributes: { ContentBasedDeduplication: true, FifoQueue: true },
          QueueName: 'foo-bar.fifo'
        });
        expect(
          sendMessage({
            MessageBody: 'foo',
            MessageGroupId: '111',
            QueueUrl: 'foo-bar.fifo'
          })
        ).toEqual({
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String)
        });
      });

      test('throw error when FifoQueue missing MessageGroupId when sending messaege', () => {
        createQueue({
          Attributes: { ContentBasedDeduplication: true, FifoQueue: true },
          QueueName: 'foo-bar.fifo'
        });
        expect(() =>
          sendMessage({
            MessageBody: 'foo',
            QueueUrl: 'foo-bar.fifo'
          })
        ).toThrow('The request must contain the parameter MessageGroupId.');
      });

      test('throw error when FifoQueue is missing ContentBasedDeduplication and MessageDeduplicationId', () => {
        createQueue({
          Attributes: { FifoQueue: true },
          QueueName: 'foo-bar.fifo'
        });
        expect(() =>
          sendMessage({
            MessageBody: 'foo',
            MessageGroupId: '1111',
            QueueUrl: 'foo-bar.fifo'
          })
        ).toThrow(
          'The queue should either have ContentBasedDeduplication enabled or MessageDeduplicationId provided explicitly'
        );
      });

      test('send message with MessageDeduplicationId', () => {
        createQueue({
          Attributes: { FifoQueue: true },
          QueueName: 'foo-bar.fifo'
        });
        expect(
          sendMessage({
            MessageBody: 'foo',
            MessageDeduplicationId: '2222',
            MessageGroupId: '1111',
            QueueUrl: 'foo-bar.fifo'
          })
        ).toEqual({
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String),
          SequenceNumber: '00000000000000000000'
        });
      });
    });
  });

  describe('sendMessageBatch', () => {
    test('successfully send message batch', () => {
      createQueue({ QueueName: 'foo-bar' });
      expect(
        sendMessageBatch({
          QueueUrl: 'http://localhost:3000/queues/foo-bar',
          messages: [
            {
              DelaySeconds: 10,
              Id: 'FuelReport-0001-2015-09-16T140731Z',

              MessageAttributes: {
                City: {
                  DataType: 'String',
                  StringValue: 'Any City'
                },
                PostalCode: {
                  DataType: 'String',
                  StringValue: '99065'
                },
                PricePerGallon: {
                  DataType: 'Number',
                  StringValue: '1.99'
                },
                Region: {
                  DataType: 'String',
                  StringValue: 'WA'
                },
                SellerName: {
                  DataType: 'String',
                  StringValue: 'Example Store'
                }
              },
              MessageBody: 'Fuel report for account 0001 on 2015-09-16 at 02:07:31 PM.'
            },
            {
              DelaySeconds: 10,
              Id: 'FuelReport-0002-2015-09-16T140930Z',
              MessageAttributes: {
                City: {
                  DataType: 'String',
                  StringValue: 'North Town'
                },
                PostalCode: {
                  DataType: 'String',
                  StringValue: '99123'
                },
                PricePerGallon: {
                  DataType: 'Number',
                  StringValue: '1.87'
                },
                Region: {
                  DataType: 'String',
                  StringValue: 'WA'
                },
                SellerName: {
                  DataType: 'String',
                  StringValue: 'Example Fuels'
                }
              },
              MessageBody: 'Fuel report for account 0002 on 2015-09-16 at 02:09:30 PM.'
            }
          ]
        })
      ).toEqual([
        {
          Id: 'a7c4d239cf2aeb107bffde4fcc803d82',
          // MD5OfMessageAttributes: '3449c9e5e332f1dbb81505cd739fbf3f',
          MDOfMessageBody: '203c4a38f1cee1cb10269e847943237e',
          MessageId: expect.any(String)
        },
        {
          Id: '4109206ec8f49219951187404de88547',
          // MD5OfMessageAttributes: '3449c9e5e332f1dbb81505cd739fbf3f',
          MDOfMessageBody: '2cf0159a0e5f31ee03a9c556c1980595',
          MessageId: expect.any(String)
        }
      ]);
    });

    test('throw error when queue does not exist', () => {
      let error;
      try {
        sendMessageBatch({ QueueUrl: 'http://localhost:3000/queues/foo', messages: [] });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
      expect(error.code).toEqual('AWS.SimpleQueueService.NonExistentQueue');
    });
  });

  describe('receiveMessage', () => {
    test('throw error when queue does not exist', () => {
      let error;
      try {
        receiveMessage({ QueueUrl: 'http://localhost:3000/queues/foo' });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
      expect(error.code).toEqual('AWS.SimpleQueueService.NonExistentQueue');
    });

    test('successfully receive message', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' });
      sendMessage({ MessageBody: 'foo', QueueUrl });
      expect(receiveMessage({ QueueUrl })).toEqual([
        {
          Body: 'foo',
          MD5OfBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: undefined,
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo',
            MessageId: expect.any(String)
          }
        ],
        undefined
      });
    });

    test('successfully receive message visibility timeout', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' });
      sendMessage({ MessageBody: 'foo', QueueUrl });
      expect(
        receiveMessage({
          QueueUrl,
          VisibilityTimeout: 3
        })
      ).toEqual([
        {
          Body: 'foo',
          MD5OfBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: undefined,
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), VisibilityTimeout: 3, isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo',
            MessageId: expect.any(String)
          }
        ],
        undefined
      });
    });

    test('successfully receive multiple messages', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' });
      sendMessage({ MessageBody: 'foo1', QueueUrl });
      sendMessage({ MessageBody: 'foo2', QueueUrl });
      sendMessage({ MessageBody: 'foo3', QueueUrl });
      sendMessage({ MessageBody: 'foo4', QueueUrl });
      sendMessage({ MessageBody: 'foo5', QueueUrl });
      expect(receiveMessage({ MaxNumberOfMessages: 3, QueueUrl, VisibilityTimeout: 2 })).toEqual([
        {
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        },
        {
          Body: 'foo2',
          MD5OfBody: '92e0057157f69e22a364d6b22dd6bbd5',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        },
        {
          Body: 'foo3',
          MD5OfBody: 'cecf7c1a4c5640928a3a73459bb3d977',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: undefined,
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), VisibilityTimeout: 2, isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          },
          {
            '@State': { ReceiptHandle: expect.any(String), VisibilityTimeout: 2, isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo2',
            MessageId: expect.any(String)
          },
          {
            '@State': { ReceiptHandle: expect.any(String), VisibilityTimeout: 2, isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo3',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo4',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo5',
            MessageId: expect.any(String)
          }
        ],
        undefined
      });
    });

    test('successfully receive multiple messages when there are less messages than requested', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' });
      sendMessage({ MessageBody: 'foo1', QueueUrl });
      sendMessage({ MessageBody: 'foo2', QueueUrl });
      expect(receiveMessage({ MaxNumberOfMessages: 3, QueueUrl })).toEqual([
        {
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        },
        {
          Body: 'foo2',
          MD5OfBody: '92e0057157f69e22a364d6b22dd6bbd5',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: undefined,
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          },
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo2',
            MessageId: expect.any(String)
          }
        ],
        undefined
      });
    });

    test('successfully receive message with message attribute All', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' });

      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      expect(receiveMessage({ MessageAttributeNames: ['All'], QueueUrl })).toEqual([
        {
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MD5OfMessageAttributes: 'b1c94ca2fbc3e78fc30069c8d0f01680',
          MessageAttributes: {
            City: {
              DataType: 'String',
              StringValue: 'Any City'
            },
            Greeting: {
              BinaryValue: 'Hello, World!',
              DataType: 'Binary'
            },
            Population: {
              DataType: 'Number',
              StringValue: '1250800'
            }
          },
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: undefined,
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryValue: 'Hello, World!',
                DataType: 'Binary'
              },
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          }
        ],
        undefined
      });
    });

    test('successfully receive message with message attributes that exist and dont exist', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' });
      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      expect(receiveMessage({ MessageAttributeNames: ['Greeting', 'Foo'], QueueUrl })).toEqual([
        {
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MD5OfMessageAttributes: '386f7371cc7c4504e61355ec5fdcee4b',
          MessageAttributes: {
            Greeting: {
              BinaryValue: 'Hello, World!',
              DataType: 'Binary'
            }
          },
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: undefined,
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryValue: 'Hello, World!',
                DataType: 'Binary'
              },
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          }
        ],
        undefined
      });
    });

    test('successfully receive message with attribute All', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' });
      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      expect(receiveMessage({ AttributeNames: ['All'], QueueUrl })).toEqual([
        {
          Attributes: {
            ApproximateFirstReceiveTimestamp: expect.any(Number),
            ApproximateReceiveCount: 1,
            SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
            SentTimestamp: expect.any(Number)
          },
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: undefined,
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryValue: 'Hello, World!',
                DataType: 'Binary'
              },
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          }
        ],
        undefined
      });
    });

    test('successfully receive message with select attributes', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' });
      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      expect(
        receiveMessage({ AttributeNames: ['SenderId', 'SentTimestamp', 'Foo'], QueueUrl })
      ).toEqual([
        {
          Attributes: {
            SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
            SentTimestamp: expect.any(Number)
          },
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: undefined,
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryValue: 'Hello, World!',
                DataType: 'Binary'
              },
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          }
        ],
        undefined
      });
    });
  });

  describe('deleteMessage', () => {
    test('successfully delete message', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' });
      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      const Messages = receiveMessage({
        AttributeNames: ['SenderId', 'SentTimestamp', 'Foo'],
        QueueUrl
      });

      expect(getQueueState(QueueUrl).messages).toEqual([
        {
          '@State': { ReceiptHandle: expect.any(String), isRead: true },
          Attributes: {
            ApproximateFirstReceiveTimestamp: expect.any(Number),
            ApproximateReceiveCount: 1,
            SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
            SentTimestamp: expect.any(Number)
          },
          MessageAttributes: {
            City: { DataType: 'String', StringValue: 'Any City' },
            Greeting: { BinaryValue: 'Hello, World!', DataType: 'Binary' },
            Population: { DataType: 'Number', StringValue: '1250800' }
          },
          MessageBody: 'foo1',
          MessageId: expect.any(String)
        }
      ]);
      deleteMessage({ QueueUrl, ReceiptHandle: Messages[0].ReceiptHandle });
      expect(getQueueState(QueueUrl).messages).toEqual([]);
    });

    test('queue does not exist', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' });
      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      const Messages = receiveMessage({
        AttributeNames: ['SenderId', 'SentTimestamp', 'Foo'],
        QueueUrl
      });

      let err1;

      try {
        deleteMessage({
          QueueUrl: 'http://localhost:3000/queues/foo-bar-does-not-exist',
          ReceiptHandle: Messages[0].ReceiptHandle
        });
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('tagQueue', () => {
    test('successfully tag queue', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { foo: 'bar' };
      createQueue({ QueueName: 'foo-bar' });
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
    });

    test('tag queue with identical tag', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { foo: 'bar' };
      createQueue({ QueueName: 'foo-bar' });
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
    });

    test('tag queue with multiple tags', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar-tags';
      const Tags1 = { foo1: 'bar1' };
      const Tags2 = { foo2: 'bar2' };
      createQueue({ QueueName: 'foo-bar-tags' });

      tagQueue(QueueUrl, Tags1);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo1: 'bar1' });
      tagQueue(QueueUrl, Tags2);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo1: 'bar1', foo2: 'bar2' });
    });
  });

  describe('untagQueue', () => {
    test('successfully untag queue', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { foo: 'bar' };
      createQueue({ QueueName: 'foo-bar' });
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
      untagQueue(QueueUrl, ['foo']);
      expect(getQueueState(QueueUrl).tags).toEqual({});
    });

    test('try to untag queue, when tag does not exist', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { foo: 'bar' };
      createQueue({ QueueName: 'foo-bar' });
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
      untagQueue(QueueUrl, ['foo1']);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
    });

    test('untag mutiple tags ', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { foo1: 'bar1', foo2: 'bar2', foo3: 'bar3' };
      createQueue({ QueueName: 'foo-bar' });
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo1: 'bar1', foo2: 'bar2', foo3: 'bar3' });
      untagQueue(QueueUrl, ['foo1', 'foo3']);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo2: 'bar2' });
    });
  });
});
