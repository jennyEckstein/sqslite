'use strict';

const {
  ChangeMessageVisibilityCommand,
  CreateQueueCommand,
  DeleteMessageBatchCommand,
  DeleteMessageCommand,
  DeleteQueueCommand,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
  ListDeadLetterSourceQueuesCommand,
  ListQueueTagsCommand,
  ListQueuesCommand,
  PurgeQueueCommand,
  ReceiveMessageCommand,
  SQSClient,
  SendMessageBatchCommand,
  SendMessageCommand,
  SetQueueAttributesCommand,
  TagQueueCommand,
  UntagQueueCommand
} = require('@aws-sdk/client-sqs');
/**
 * TODO: Fix port for all https://github.com/aws/aws-sdk-js-v3/issues/1930
 * TODO: Find how to pass RequestId to $metadata, really need it?
 */
const index = require('.');

describe('lib/index', () => {
  const port = Math.round(Math.random() * 5000 + 1000);
  const endpoint = `http://localhost:${port}`;
  let sqsLiteServer;
  let client;

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sqsLiteServer = index({ logger: false });
      sqsLiteServer.listen(port, (err) => {
        if (err) reject(err);
        else {
          try {
            client = new SQSClient({
              credentials: {
                accessKeyId: 'foo',
                secretAccessKey: 'bar'
              },
              endpoint,
              region: 'us-east-1'
            });
            resolve();
          } catch (err_) {
            reject(err_);
          }
        }
      });
    });
  });

  describe('listQueues', () => {
    test('list queues', async () => {
      const { $metadata, ...result } = await client.send(new ListQueuesCommand({}));
      expect(result).toEqual({});
    });
  });

  describe('createQueue', () => {
    describe('QueueName', () => {
      test('throw an error when queue name is too long', async () => {
        await expect(
          client.send(
            new CreateQueueCommand({
              QueueName:
                '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
            })
          )
        ).rejects.toThrow(
          'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
        );
      });

      test('throw an error when queue name has invalid characters', async () => {
        await expect(client.send(new CreateQueueCommand({ QueueName: 'abc@' }))).rejects.toThrow(
          'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
        );
      });

      test('successfully create queue', async () => {
        const command = new CreateQueueCommand({ QueueName: 'foo-bar' });
        const { $metadata, ...result } = await client.send(command);
        expect(result).toEqual({ QueueUrl: `http://localhost/queues/foo-bar` });
      });
    });

    describe('Attributes', () => {
      describe('DelaySeconds', () => {
        test('throw error when DelaySeconds is larger than allowed', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { DelaySeconds: '901' },
                QueueName: 'foo-bar-delaySeconds'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter DelaySeconds.');
        });

        test('throw error when DelaySeconds is lower than allowed', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { DelaySeconds: '-1' },
                QueueName: 'foo-bar-delaySeconds'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter DelaySeconds.');
        });

        test('create queue with DelaySeconds attribute', async () => {
          const { $metadata, ...result } = await client.send(
            new CreateQueueCommand({
              Attributes: { DelaySeconds: '10' },
              QueueName: 'foo-bar-delaySeconds'
            })
          );
          expect(result).toEqual({ QueueUrl: `http://localhost/queues/foo-bar-delaySeconds` });
        });
      });

      describe('MaximumMessageSize', () => {
        test('throw error when MaximumMessageSize is larger than allowed value', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { MaximumMessageSize: '262145' },
                QueueName: 'foo-bar-maximumMessageSize'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter MaximumMessageSize.');
        });

        test('throw error when MaximumMessageSize is lower than allowed value', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { MaximumMessageSize: '1023' },
                QueueName: 'foo-bar-maximumMessageSize'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter MaximumMessageSize.');
        });

        test('create queue with MaximumMessageSize', async () => {
          const { $metadata, ...result } = await client.send(
            new CreateQueueCommand({
              Attributes: { MaximumMessageSize: '1024' },
              QueueName: 'foo-bar-maximumMessageSize'
            })
          );
          expect(result).toEqual({
            QueueUrl: `http://localhost/queues/foo-bar-maximumMessageSize`
          });
        });
      });

      describe('MessageRetentionPeriod', () => {
        /**
         * aws sqs create-queue --queue-name=foo-bar-messageRetentionPeriod --attributes MessageRetentionPeriod=1209601 --region=us-east-1 --debug
         */
        test('throw an error when MessageRetentionPeriod larger than allowed', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { MessageRetentionPeriod: '1209601' },
                QueueName: 'foo-bar-messageRetentionPeriod'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter MessageRetentionPeriod.');
        });

        test('throw an error when MessageRetentionPeriod lower than allowed', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { MessageRetentionPeriod: '59' },
                QueueName: 'foo-bar-messageRetentionPeriod'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter MessageRetentionPeriod.');
        });

        test('create queue with MessageRetentionPeriodattribute', async () => {
          const { $metadata, ...result } = await client.send(
            new CreateQueueCommand({
              Attributes: { MessageRetentionPeriod: '60' },
              QueueName: 'foo-bar-messageRetentionPeriod'
            })
          );
          expect(result).toEqual({
            QueueUrl: `http://localhost/queues/foo-bar-messageRetentionPeriod`
          });
        });
      });

      describe('ReceiveMessageWaitTimeSeconds', () => {
        /**
         * aws sqs create-queue --queue-name=foo-bar-receiveMessageWaitTimeSeconds --attributes ReceiveMessageWaitTimeSeconds=21 --region=us-east-1 --debug
         */
        test('throw an error when ReceiveMessageWaitTimeSeconds is larger value than allowed', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { ReceiveMessageWaitTimeSeconds: '21' },
                QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter ReceiveMessageWaitTimeSeconds.');
        });

        test('throw an error when ReceiveMessageWaitTimeSeconds is lower value than allowed', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { ReceiveMessageWaitTimeSeconds: '-1' },
                QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter ReceiveMessageWaitTimeSeconds.');
        });

        test('create queue with ReceiveMessageWaitTimeSeconds', async () => {
          const { $metadata, ...result } = await client.send(
            new CreateQueueCommand({
              Attributes: { ReceiveMessageWaitTimeSeconds: '0' },
              QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
            })
          );
          expect(result).toEqual({
            QueueUrl: `http://localhost/queues/foo-bar-receiveMessageWaitTimeSeconds`
          });
        });
      });

      describe('RedrivePolicy', () => {
        test('throw an error when RedrivePolicy missing deadLetterTargetArn', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { RedrivePolicy: '{"maxReceiveCount":"1000"}' },
                QueueName: 'foo-bar'
              })
            )
          ).rejects.toThrow(
            'Value {"maxReceiveCount":"1000"} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
          );
        });

        test('throw an error when RedrivePolicy missing maxReceiveCount', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: {
                  RedrivePolicy:
                    '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue"}'
                },
                QueueName: 'foo-bar'
              })
            )
          ).rejects.toThrow(
            'Value {"deadLetterTargetArn":"arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue"} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.'
          );
        });

        test('throw error when creating queue with same name but different deadLetterTargetArn', async () => {
          await client.send(new CreateQueueCommand({ QueueName: 'dead-letter-queue1' }));
          await client.send(new CreateQueueCommand({ QueueName: 'dead-letter-queue2' }));
          await client.send(
            new CreateQueueCommand({
              Attributes: {
                RedrivePolicy:
                  '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue1","maxReceiveCount": "10"}'
              },
              QueueName: 'foo-bar-123'
            })
          );
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: {
                  RedrivePolicy:
                    '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue2","maxReceiveCount": "10"}'
                },
                QueueName: 'foo-bar-123'
              })
            )
          ).rejects.toThrow(
            'A queue already exists with the same name and a different value for attribute RedrivePolicy'
          );
        });

        test('throw error when creating queue with same name but different maxReceiveCount', async () => {
          await client.send(new CreateQueueCommand({ QueueName: 'dead-letter-queue1' }));
          await client.send(
            new CreateQueueCommand({
              Attributes: {
                RedrivePolicy:
                  '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue1","maxReceiveCount": "5"}'
              },
              QueueName: 'foo-bar-456'
            })
          );
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: {
                  RedrivePolicy:
                    '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue1","maxReceiveCount": "10"}'
                },
                QueueName: 'foo-bar-456'
              })
            )
          ).rejects.toThrow(
            'A queue already exists with the same name and a different value for attribute RedrivePolicy'
          );
        });

        test('create queue with Redrive Policy', async () => {
          await client.send(new CreateQueueCommand({ QueueName: 'foo-bar-dlq' }));
          const { $metadata, ...result } = await client.send(
            new CreateQueueCommand({
              Attributes: {
                RedrivePolicy:
                  '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:queues:foo-bar-dlq","maxReceiveCount":10}'
              },
              QueueName: 'foo-bar'
            })
          );
          expect(result).toEqual({ QueueUrl: `http://localhost/queues/foo-bar` });
        });
      });

      describe('VisibilityTimeout', () => {
        test('throw an error when VisibilityTimeout is larger value than allowed', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { VisibilityTimeout: '43201' },
                QueueName: 'foo-bar-visibilityTimeout'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter VisibilityTimeout.');
        });

        test('throw an error when VisibilityTimeout is lower value than allowed', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { VisibilityTimeout: '-1' },
                QueueName: 'foo-bar-visibilityTimeout'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter VisibilityTimeout.');
        });

        test('create queue with VisibilityTimeout attribute', async () => {
          const { $metadata, ...result } = await client.send(
            new CreateQueueCommand({
              Attributes: { VisibilityTimeout: '30' },
              QueueName: 'foo-bar-visibilityTimeout'
            })
          );
          expect(result).toEqual({ QueueUrl: `http://localhost/queues/foo-bar-visibilityTimeout` });
        });
      });

      describe('KmsMasterKeyId', () => {
        /**
         * AWS seems to not verify value for KmsMasterKeyId
         */
        test('create queue with KmsMasterKeyId attribute', async () => {
          const { $metadata, ...result } = await client.send(
            new CreateQueueCommand({
              Attributes: { KmsMasterKeyId: 'foo' },
              QueueName: 'foo-bar-kmsMasterKeyId'
            })
          );
          expect(result).toEqual({ QueueUrl: `http://localhost/queues/foo-bar-kmsMasterKeyId` });
        });
      });

      describe('KmsDataKeyReusePeriodSeconds', () => {
        test('throw error when KmsDataKeyReusePeriodSeconds value is larger than allowed', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { KmsDataKeyReusePeriodSeconds: '86401' },
                QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter KmsDataKeyReusePeriodSeconds.');
        });

        test('throw error when KmsDataKeyReusePeriodSeconds value is lower than allowed', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { KmsDataKeyReusePeriodSeconds: '59' },
                QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
              })
            )
          ).rejects.toThrow('Invalid value for the parameter KmsDataKeyReusePeriodSeconds.');
        });

        test('create queue with KmsDataKeyReusePeriodSeconds attribute', async () => {
          const { $metadata, ...result } = await client.send(
            new CreateQueueCommand({
              Attributes: { KmsDataKeyReusePeriodSeconds: '60' },
              QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
            })
          );
          expect(result).toEqual({
            QueueUrl: `http://localhost/queues/foo-bar-kmsDataKeyReusePeriodSeconds`
          });
        });
      });

      describe('FifoQueue', () => {
        test('throw an error when attempting to create fifo queue with no .fifo postfix', async () => {
          await expect(
            client.send(
              new CreateQueueCommand({ Attributes: { FifoQueue: 'true' }, QueueName: 'foo-bar' })
            )
          ).rejects.toThrow(
            'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.'
          );
        });
      });

      describe('Attribute Errors', () => {
        test('QueueAlreadyExists when trying to create duplicate queue with different params', async () => {
          await client.send(
            new CreateQueueCommand({
              Attributes: { DelaySeconds: '100' },
              QueueName: 'test-duplicate'
            })
          );
          await expect(
            client.send(
              new CreateQueueCommand({
                Attributes: { DelaySeconds: '100', VisibilityTimeout: '500' },
                QueueName: 'test-duplicate'
              })
            )
          ).rejects.toThrow(
            'A queue already exists with the same name and a different value for attribute VisibilityTimeout'
          );
        });
      });
    });

    describe('Tags', () => {
      test('successfully create queue with tags', async () => {
        const { $metadata, ...result } = await client.send(
          new CreateQueueCommand({
            QueueName: 'foo-bar-with-tags',
            tags: { foo: 'bar', foo1: 'bar1' }
          })
        );
        expect(result).toEqual({ QueueUrl: `http://localhost/queues/foo-bar-with-tags` });
      });
    });

    test('throw error when attempting to set ContentBasedDeduplication, with a non FIFO queue', async () => {
      await expect(
        client.send(
          new CreateQueueCommand({
            Attributes: { ContentBasedDeduplication: 'true' },
            QueueName: 'foo-bar'
          })
        )
      ).rejects.toThrow('Unknown Attribute ContentBasedDeduplication.');
    });
  });

  describe('sendMessage', () => {
    test('successfully send message', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      const { $metadata, ...result } = await client.send(
        new SendMessageCommand({
          MessageBody: 'foo',
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toEqual({
        MD5OfMessageBody: expect.any(String),
        MessageId: expect.any(String)
      });
    });

    test('throw error when queue does not exist', async () => {
      await expect(
        client.send(
          new SendMessageCommand({
            MessageBody: 'some message',
            QueueUrl: `${endpoint}/queues/foo-bar123`
          })
        )
      ).rejects.toThrow('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('sendMessageBatch', () => {
    test('successfully send batch of messages, with no message attributes', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      const { $metadata, ...result } = await client.send(
        new SendMessageBatchCommand({
          Entries: [
            { Id: '1', MessageBody: 'mb1' },
            { Id: '2', MessageBody: 'mb2' }
          ],
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toEqual({
        Successful: [
          { Id: 'c4ca4238a0b923820dcc509a6f75849b', MessageId: expect.any(String) },
          { Id: 'c81e728d9d4c2f636f067f89cc14862c', MessageId: expect.any(String) }
        ]
      });
    });

    test('successfully send batch of messages', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      const { $metadata, ...result } = await client.send(
        new SendMessageBatchCommand({
          Entries: [
            {
              DelaySeconds: 10,
              Id: 'FuelReport-0001-2015-09-16T140731Z',
              MessageAttributes: {
                City: { DataType: 'String', StringValue: 'Any City' },
                PostalCode: { DataType: 'String', StringValue: '99065' },
                PricePerGallon: { DataType: 'Number', StringValue: '1.99' },
                Region: { DataType: 'String', StringValue: 'WA' },
                SellerName: { DataType: 'String', StringValue: 'Example Store' }
              },
              MessageBody: 'Fuel report for account 0001 on 2015-09-16 at 02:07:31 PM.'
            },
            {
              DelaySeconds: 10,
              Id: 'FuelReport-0002-2015-09-16T140930Z',
              MessageAttributes: {
                City: { DataType: 'String', StringValue: 'North Town' },
                PostalCode: { DataType: 'String', StringValue: '99123' },
                PricePerGallon: { DataType: 'Number', StringValue: '1.87' },
                Region: { DataType: 'String', StringValue: 'WA' },
                SellerName: { DataType: 'String', StringValue: 'Example Fuels' }
              },
              MessageBody: 'Fuel report for account 0002 on 2015-09-16 at 02:09:30 PM.'
            }
          ],
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toEqual({
        Successful: [
          {
            Id: 'a7c4d239cf2aeb107bffde4fcc803d82',
            MD5OfMessageAttributes: '10809b55e3d9b22c17220b7dbaf283ef',
            MessageId: expect.any(String)
          },
          {
            Id: '4109206ec8f49219951187404de88547',
            MD5OfMessageAttributes: '556239281d7bf8f3723977ecae354a25',
            MessageId: expect.any(String)
          }
        ]
      });
    });
  });

  describe('receiveMessage', () => {
    test('successfully receive message', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({ MessageBody: 'foo', QueueUrl: `${endpoint}/queues/core-test` })
      );
      const { $metadata, ...result } = await client.send(
        new ReceiveMessageCommand({ QueueUrl: `${endpoint}/queues/core-test` })
      );
      expect(result).toEqual({
        Messages: [
          {
            Body: 'foo',
            MD5OfBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ]
      });
    });

    test('successfully receive multiple messages', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({ MessageBody: 'foo1', QueueUrl: `${endpoint}/queues/core-test` })
      );
      await client.send(
        new SendMessageCommand({ MessageBody: 'foo2', QueueUrl: `${endpoint}/queues/core-test` })
      );
      await client.send(
        new SendMessageCommand({ MessageBody: 'foo3', QueueUrl: `${endpoint}/queues/core-test` })
      );
      const { $metadata, ...result } = await client.send(
        new ReceiveMessageCommand({
          MaxNumberOfMessages: 3,
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toMatchObject({
        Messages: [
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
        ]
      });
    });

    test('successfully receive multiple messages when there are less messages than requested', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({ MessageBody: 'foo1', QueueUrl: `${endpoint}/queues/core-test` })
      );
      const { $metadata, ...result } = await client.send(
        new ReceiveMessageCommand({
          MaxNumberOfMessages: 3,
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toEqual({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ]
      });
    });

    test('return no messages when there are no messages to return', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      const { $metadata, ...result } = await client.send(
        new ReceiveMessageCommand({
          MaxNumberOfMessages: 1,
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toEqual({});
    });

    test('receive messages with message attribute All', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({
          MessageAttributes: {
            City: {
              DataType: 'String',
              StringValue: 'Any City'
            },
            Greeting: {
              BinaryValue: new Uint8Array('Hello, World!'),
              DataType: 'Binary'
            },
            Population: {
              DataType: 'Number',
              StringValue: '1250800'
            }
          },
          MessageBody: 'foo1',
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      const { $metadata, ...result } = await client.send(
        new ReceiveMessageCommand({
          MaxNumberOfMessages: 1,
          MessageAttributeNames: ['All'],
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toMatchObject({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
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
        ]
      });
    });

    test('receive message with specific attribute', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({
          MessageAttributes: {
            City: {
              DataType: 'String',
              StringValue: 'Any City'
            },
            Greeting: {
              BinaryValue: new Uint8Array('Hello, World!'),
              DataType: 'Binary'
            },
            Population: {
              DataType: 'Number',
              StringValue: '1250800'
            }
          },
          MessageBody: 'foo1',
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      const { $metadata, ...result } = await client.send(
        new ReceiveMessageCommand({
          MaxNumberOfMessages: 1,
          MessageAttributeNames: ['Population'],
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toMatchObject({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MD5OfMessageAttributes: '13e03873859867aeade5b25ed6b00278',
            MessageAttributes: {
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ]
      });
    });

    test('receive messages with multiple specific attributes', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({
          MessageAttributes: {
            City: {
              DataType: 'String',
              StringValue: 'Any City'
            },
            Greeting: {
              BinaryValue: new Uint8Array('Hello, World!'),
              DataType: 'Binary'
            },
            Population: {
              DataType: 'Number',
              StringValue: '1250800'
            }
          },
          MessageBody: 'foo1',
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      const { $metadata, ...result } = await client.send(
        new ReceiveMessageCommand({
          MaxNumberOfMessages: 1,
          MessageAttributeNames: ['Population', 'City'],
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      // TODO: test that reads binary data
      expect(result).toMatchObject({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MD5OfMessageAttributes: '1364ec47767b4a8e2f5a6902227c25af',
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ]
      });
    });

    test('receive messages with multiple specific attributes excluding non existent', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({
          MessageAttributes: {
            City: {
              DataType: 'String',
              StringValue: 'Any City'
            },
            Greeting: {
              BinaryValue: new Uint8Array('Hello, World!'),
              DataType: 'Binary'
            },
            Population: {
              DataType: 'Number',
              StringValue: '1250800'
            }
          },
          MessageBody: 'foo1',
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );

      const { $metadata, ...result } = await client.send(
        new ReceiveMessageCommand({
          MaxNumberOfMessages: 1,
          MessageAttributeNames: ['Population', 'Foo', 'City'],
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toMatchObject({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MD5OfMessageAttributes: 'ee165550f65c6a28fa8a29201ec4154c',
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ]
      });
    });

    test('receive messages with multiple attributes', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({
          MessageBody: 'foo1',
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      const { $metadata, ...result } = await client.send(
        new ReceiveMessageCommand({
          AttributeNames: ['All'],
          MaxNumberOfMessages: 1,
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toMatchObject({
        Messages: [
          {
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.anything(),
              ApproximateReceiveCount: '1',
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.anything()
            },
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ]
      });
    });
  });

  describe('deleteMessage', () => {
    test('successfully delete message', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({ MessageBody: 'foo', QueueUrl: `${endpoint}/queues/core-test` })
      );
      const { Messages } = await client.send(
        new ReceiveMessageCommand({ QueueUrl: `${endpoint}/queues/core-test` })
      );
      const { $metadata, ...result } = await client.send(
        new DeleteMessageCommand({
          QueueUrl: `${endpoint}/queues/core-test`,
          ReceiptHandle: Messages[0].ReceiptHandle
        })
      );
      expect(result).toEqual({});
    });
  });

  describe('deleteMessageBatch', () => {
    test('successfully delete message batch', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({ MessageBody: 'foo1', QueueUrl: `${endpoint}/queues/core-test` })
      );
      await client.send(
        new SendMessageCommand({ MessageBody: 'foo1', QueueUrl: `${endpoint}/queues/core-test` })
      );
      const Receive1 = await client.send(
        new ReceiveMessageCommand({ QueueUrl: `${endpoint}/queues/core-test` })
      );
      const Receive2 = await client.send(
        new ReceiveMessageCommand({ QueueUrl: `${endpoint}/queues/core-test` })
      );
      const Entries = [
        { Id: Receive1.Messages[0].MessageId, ReceiptHandle: Receive1.Messages[0].ReceiptHandle },
        { Id: Receive2.Messages[0].MessageId, ReceiptHandle: Receive2.Messages[0].ReceiptHandle }
      ];

      const { $metadata, ...result } = await client.send(
        new DeleteMessageBatchCommand({
          Entries,
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      expect(result).toEqual({
        Successful: [{ Id: expect.any(String) }, { Id: expect.any(String) }]
      });
    });

    test('when queue does not exist', async () => {
      let err1;
      try {
        await client.send(
          new DeleteMessageBatchCommand({
            Entries: [
              { Id: '1001', ReceiptHandle: '100001' },
              { Id: '1002', ReceiptHandle: '100002' }
            ],
            QueueUrl: `${endpoint}/queues/core-test-does-not-exist`
          })
        );
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('deleteQueue', () => {
    test('successfully delete queue', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      const { $metadata, ...result } = client.send(
        new DeleteQueueCommand({ QueueUrl: `${endpoint}/queues/core-test` })
      );
      await expect(result).toEqual({});
    });
  });

  describe('tagQueue', () => {
    test('successfully tag queue', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      const { $metadata, ...result } = await client.send(
        new TagQueueCommand({
          QueueUrl: `${endpoint}/queues/core-test`,
          Tags: { foo: 'bar' }
        })
      );
      expect(result).toEqual({});
    });
  });

  describe('listQueueTags', () => {
    test('list tags when no tags exist', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      const { $metadata, ...result } = await client.send(
        new ListQueueTagsCommand({ QueueUrl: `${endpoint}/queues/core-test` })
      );
      expect(result).toEqual({});
    });

    test('list tags', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new TagQueueCommand({
          QueueUrl: `${endpoint}/queues/core-test`,
          Tags: { baz: 'ban', foo: 'bar' }
        })
      );
      const { $metadata, ...result } = await client.send(
        new ListQueueTagsCommand({ QueueUrl: `${endpoint}/queues/core-test` })
      );
      expect(result).toEqual({
        Tags: { baz: 'ban', foo: 'bar' }
      });
    });
  });

  describe('untagQueue', () => {
    test('successfully untag queue', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      const { $metadata, ...result } = await client.send(
        new UntagQueueCommand({
          QueueUrl: `${endpoint}/queues/core-test`,
          TagKeys: ['foo']
        })
      );
      expect(result).toEqual({});
    });
  });

  describe('setQueueAttributes', () => {
    test('set basic queue attributes', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'foo-bar' }));
      const { $metadata, ...result } = await client.send(
        new SetQueueAttributesCommand({
          Attributes: {
            DelaySeconds: '11',
            MaximumMessageSize: '111111',
            MessageRetentionPeriod: '21111',
            ReceiveMessageWaitTimeSeconds: '11',
            VisibilityTimeout: '11'
          },
          QueueUrl: `${endpoint}/queues/foo-bar`
        })
      );
      expect(result).toEqual({});
    });

    test('set queue attributes for fifo queue with redrive policy', async () => {
      await client.send(
        new CreateQueueCommand({ Attributes: { FifoQueue: 'true' }, QueueName: 'foo-bar.fifo' })
      );

      await client.send(
        new CreateQueueCommand({ Attributes: { FifoQueue: 'true' }, QueueName: 'foo-bar-dlq.fifo' })
      );

      const { $metadata, ...result } = await client.send(
        new SetQueueAttributesCommand({
          Attributes: {
            DelaySeconds: '11',
            FifoQueue: 'true',
            MaximumMessageSize: '111111',
            MessageRetentionPeriod: '21111',
            ReceiveMessageWaitTimeSeconds: '11',
            RedrivePolicy:
              '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:queues:foo-bar-dlq.fifo","maxReceiveCount":"1000"}',
            VisibilityTimeout: '11'
          },
          QueueUrl: `${endpoint}/queues/foo-bar.fifo`
        })
      );
      expect(result).toEqual({});
    });
  });

  describe('getQueueAttributes', () => {
    test('throw error when queue does not exist', async () => {
      await expect(
        client.send(
          new GetQueueAttributesCommand({ QueueUrl: `${endpoint}/queues/foo-bar-does-not-exist` })
        )
      ).rejects.toThrow('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });

    test('return some selected attributes queue attributes', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'foo-bar-test' }));
      const { $metadata, ...result } = await client.send(
        new GetQueueAttributesCommand({
          AttributeNames: ['MaximumMessageSize', 'ApproximateNumberOfMessages'],
          QueueUrl: `${endpoint}/queues/foo-bar-test`
        })
      );
      expect(result).toEqual({
        Attributes: { ApproximateNumberOfMessages: '0', MaximumMessageSize: '262144' }
      });
    });

    test('return all attributes queue attributes', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'foo-bar-test' }));
      const { $metadata, ...result } = await client.send(
        new GetQueueAttributesCommand({
          AttributeNames: ['All', 'ApproximateNumberOfMessages'],
          QueueUrl: `${endpoint}/queues/foo-bar-test`
        })
      );
      expect(result).toEqual({
        Attributes: {
          ApproximateNumberOfMessages: '0',
          CreatedTimestamp: expect.anything(),
          DelaySeconds: '0',
          FifoQueue: 'false',
          KmsDataKeyReusePeriodSeconds: '300',
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: '262144',
          MessageRetentionPeriod: '345600',
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar-test',
          ReceiveMessageWaitTimeSeconds: '0',
          VisibilityTimeout: '30'
        }
      });
    });
  });

  describe('getQueueUrl', () => {
    test('successfully get queue url', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test1' }));
      const { $metadata, ...result } = await client.send(
        new GetQueueUrlCommand({ QueueName: 'core-test1' })
      );
      expect(result).toEqual({
        QueueUrl: `http://localhost/queues/core-test1`
      });
    });

    test('throw error when queue does not exist', async () => {
      await expect(
        client.send(new GetQueueUrlCommand({ QueueName: 'core-test123' }))
      ).rejects.toThrow('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('purgeQueue', () => {
    test('successfully purge queue', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test' }));
      await client.send(
        new SendMessageCommand({
          MessageBody: 'some message',
          QueueUrl: `${endpoint}/queues/core-test`
        })
      );
      const { $metadata, ...result } = await client.send(
        new PurgeQueueCommand({
          QueueUrl: `http://localhost:${port}/queues/core-test`
        })
      );
      expect(result).toEqual({});
    });

    test('throw error when queue does not exist', async () => {
      await expect(
        client.send(
          new PurgeQueueCommand({
            QueueUrl: `http://localhost:${port}/queues/core-test-does-not-exist`
          })
        )
      ).rejects.toThrow('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('listDeadLetterSourceQueues', () => {
    test('successfully get dead letter queue sources', async () => {
      await client.send(new CreateQueueCommand({ QueueName: 'core-test-1' }));
      await client.send(new CreateQueueCommand({ QueueName: 'core-test-2' }));
      await client.send(new CreateQueueCommand({ QueueName: 'core-test-dlq' }));
      await client.send(
        new SetQueueAttributesCommand({
          Attributes: {
            RedrivePolicy:
              '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:queues:core-test-dlq","maxReceiveCount":"1000"}'
          },
          QueueUrl: `${endpoint}/queues/core-test-1`
        })
      );
      await client.send(
        new SetQueueAttributesCommand({
          Attributes: {
            FifoQueue: 'false',
            RedrivePolicy:
              '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:queues:core-test-dlq","maxReceiveCount":"1000"}'
          },
          QueueUrl: `${endpoint}/queues/core-test-2`
        })
      );
      const { $metadata, ...result } = await client.send(
        new ListDeadLetterSourceQueuesCommand({
          QueueUrl: `http://localhost:${port}/queues/core-test-dlq`
        })
      );
      expect(result).toEqual({
        queueUrls: [`http://localhost/queues/core-test-1`, `http://localhost/queues/core-test-2`]
      });
    });
  });

  describe('changeMessageVisibility', () => {
    test('throw error when queue does not exist', async () => {
      await expect(
        client.send(
          new ChangeMessageVisibilityCommand({
            QueueUrl: `http://localhost:${port}/queues/core-test-changeVisibility-notCreated`,
            ReceiptHandle: '10001',
            VisibilityTimeout: '501'
          })
        )
      ).rejects.toThrow('The specified queue does not exist for this wsdl version.');
    });

    test('successfully change message visibility', async () => {
      await client.send(
        new CreateQueueCommand({
          Attributes: { VisibilityTimeout: '200' },
          QueueName: 'core-test-changeVisibility'
        })
      );
      await client.send(
        new SendMessageCommand({
          MessageBody: 'foo1',
          QueueUrl: `http://localhost:${port}/queues/core-test-changeVisibility`
        })
      );
      const receivedMessage = await client.send(
        new ReceiveMessageCommand({
          QueueUrl: `http://localhost:${port}/queues/core-test-changeVisibility`,
          VisibilityTimeout: '500'
        })
      );
      const { $metadata, ...result } = await client.send(
        new ChangeMessageVisibilityCommand({
          QueueUrl: `http://localhost:${port}/queues/core-test-changeVisibility`,
          ReceiptHandle: receivedMessage.Messages[0].ReceiptHandle,
          VisibilityTimeout: '501'
        })
      );
      expect(result).toEqual({});
    });

    test('throw error when VisibilityTimeout is out of range', async () => {
      await client.send(
        new CreateQueueCommand({
          Attributes: { VisibilityTimeout: '200' },
          QueueName: 'core-test-changeVisibility'
        })
      );
      await client.send(
        new SendMessageCommand({
          MessageBody: 'foo1',
          QueueUrl: `http://localhost:${port}/queues/core-test-changeVisibility`
        })
      );
      const receivedMessage = await client.send(
        new ReceiveMessageCommand({
          QueueUrl: `http://localhost:${port}/queues/core-test-changeVisibility`,
          VisibilityTimeout: '500'
        })
      );
      await expect(
        client.send(
          new ChangeMessageVisibilityCommand({
            QueueUrl: `http://localhost:${port}/queues/core-test-changeVisibility`,
            ReceiptHandle: receivedMessage.Messages[0].ReceiptHandle,
            VisibilityTimeout: '-1'
          })
        )
      ).rejects.toThrow(
        'An error occurred (InvalidParameterValue) when calling the ChangeMessageVisibility operation: Value -1 for parameter VisibilityTimeout is invalid. Reason: VisibilityTimeout must be an integer between 0 and 43200'
      );
      await expect(
        client.send(
          new ChangeMessageVisibilityCommand({
            QueueUrl: `http://localhost:${port}/queues/core-test-changeVisibility`,
            ReceiptHandle: receivedMessage.Messages[0].ReceiptHandle,
            VisibilityTimeout: '43201'
          })
        )
      ).rejects.toThrow(
        'An error occurred (InvalidParameterValue) when calling the ChangeMessageVisibility operation: Value 43201 for parameter VisibilityTimeout is invalid. Reason: VisibilityTimeout must be an integer between 0 and 43200'
      );
    });
  });

  describe('Default Option', () => {
    test('result to default option when Action is not implemented', () => {
      expect.assertions(1);
      const http = require('http');
      const body = 'Action=foo';

      return new Promise((resolve) => {
        const req = http.request(
          {
            headers: {
              'Content-Length': body.length,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'POST',
            path: '/',
            port
          },
          (res) => {
            res.on('data', (chunk) => {
              expect(chunk.toString('utf8')).toEqual('Action: foo is not implemented');
            });
            res.on('end', () => {
              resolve();
            });
          }
        );
        req.write(body);
        req.end();
      });
    });
  });

  afterAll(() => {
    sqsLiteServer.close();
  });
});
