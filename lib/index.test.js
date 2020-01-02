'use strict';

const { SQS } = require('aws-sdk');
const index = require('.');
require('jest-xml-matcher');

describe('lib/index', () => {
  const port = Math.round(Math.random() * 5000 + 1000);
  const endpoint = `http://localhost:${port}`;
  let sqsLiteServer;
  let client;

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sqsLiteServer = index({ logger: false });
      sqsLiteServer.listen(port, err => {
        if (err) reject(err);
        else {
          try {
            client = new SQS({
              accessKeyId: 'foo',
              endpoint,
              region: 'us-east-1',
              secretAccessKey: 'bar'
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
      const result = await client.listQueues({}).promise();
      expect(result).toEqual({
        ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
      });
    });
  });

  describe('createQueue', () => {
    describe('QueueName', () => {
      test('throw an error when queue name is too long', async () => {
        const params = {
          QueueName:
            '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
        };

        await expect(client.createQueue(params).promise()).rejects.toThrow(
          'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
        );
      });

      test('throw an error when queue name has invalid characters', async () => {
        const params = { QueueName: 'abc@' };
        await expect(client.createQueue(params).promise()).rejects.toThrow(
          'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
        );
      });

      test('successfully create queue', async () => {
        const params = { QueueName: 'foo-bar' };
        const expectedResult = {
          QueueUrl: 'https://queue.amazonaws.com/queues/foo-bar',
          ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
        };
        await expect(client.createQueue(params).promise()).resolves.toEqual(expectedResult);
      });
    });

    describe('Attributes', () => {
      describe('DelaySeconds', () => {
        test('throw error when DelaySeconds is larger than allowed', async () => {
          const params = {
            Attributes: { DelaySeconds: '901' },
            QueueName: 'foo-bar-delaySeconds'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter DelaySeconds.'
          );
        });

        test('throw error when DelaySeconds is lower than allowed', async () => {
          const params = {
            Attributes: { DelaySeconds: '-1' },
            QueueName: 'foo-bar-delaySeconds'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter DelaySeconds.'
          );
        });

        test('create queue with DelaySeconds attribute', async () => {
          const params = {
            Attributes: { DelaySeconds: '10' },
            QueueName: 'foo-bar-delaySeconds'
          };
          const expectedResponse = {
            QueueUrl: 'https://queue.amazonaws.com/queues/foo-bar-delaySeconds',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          };
          await expect(client.createQueue(params).promise()).resolves.toEqual(expectedResponse);
        });
      });

      describe('MaximumMessageSize', () => {
        test('throw error when MaximumMessageSize is larger than allowed value', async () => {
          const params = {
            Attributes: { MaximumMessageSize: '262145' },
            QueueName: 'foo-bar-maximumMessageSize'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter MaximumMessageSize.'
          );
        });

        test('throw error when MaximumMessageSize is lower than allowed value', async () => {
          const params = {
            Attributes: { MaximumMessageSize: '1023' },
            QueueName: 'foo-bar-maximumMessageSize'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter MaximumMessageSize.'
          );
        });

        test('create queue with MaximumMessageSize', async () => {
          const params = {
            Attributes: { MaximumMessageSize: '1024' },
            QueueName: 'foo-bar-maximumMessageSize'
          };
          const expectedResponse = {
            QueueUrl: 'https://queue.amazonaws.com/queues/foo-bar-maximumMessageSize',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          };
          await expect(client.createQueue(params).promise()).resolves.toEqual(expectedResponse);
        });
      });

      describe('MessageRetentionPeriod', () => {
        /**
         * aws sqs create-queue --queue-name=foo-bar-messageRetentionPeriod --attributes MessageRetentionPeriod=1209601 --region=us-east-1 --debug
         */
        test('throw an error when MessageRetentionPeriod larger than allowed', async () => {
          const params = {
            Attributes: { MessageRetentionPeriod: '1209601' },
            QueueName: 'foo-bar-messageRetentionPeriod'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter MessageRetentionPeriod.'
          );
        });

        test('throw an error when MessageRetentionPeriod lower than allowed', async () => {
          const params = {
            Attributes: { MessageRetentionPeriod: '59' },
            QueueName: 'foo-bar-messageRetentionPeriod'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter MessageRetentionPeriod.'
          );
        });

        test('create queue with MessageRetentionPeriodattribute', async () => {
          const params = {
            Attributes: { MessageRetentionPeriod: '60' },
            QueueName: 'foo-bar-messageRetentionPeriod'
          };
          const expectedResponse = {
            QueueUrl: 'https://queue.amazonaws.com/queues/foo-bar-messageRetentionPeriod',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          };
          await expect(client.createQueue(params).promise()).resolves.toEqual(expectedResponse);
        });
      });

      describe('ReceiveMessageWaitTimeSeconds', () => {
        /**
         * aws sqs create-queue --queue-name=foo-bar-receiveMessageWaitTimeSeconds --attributes ReceiveMessageWaitTimeSeconds=21 --region=us-east-1 --debug
         */
        test('throw an error when ReceiveMessageWaitTimeSeconds is larger value than allowed', async () => {
          const params = {
            Attributes: { ReceiveMessageWaitTimeSeconds: '21' },
            QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter ReceiveMessageWaitTimeSeconds.'
          );
        });

        test('throw an error when ReceiveMessageWaitTimeSeconds is lower value than allowed', async () => {
          const params = {
            Attributes: { ReceiveMessageWaitTimeSeconds: '-1' },
            QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter ReceiveMessageWaitTimeSeconds.'
          );
        });

        test('create queue with ReceiveMessageWaitTimeSeconds', async () => {
          const params = {
            Attributes: { ReceiveMessageWaitTimeSeconds: '0' },
            QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
          };
          const expectedResponse = {
            QueueUrl: 'https://queue.amazonaws.com/queues/foo-bar-receiveMessageWaitTimeSeconds',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          };
          await expect(client.createQueue(params).promise()).resolves.toEqual(expectedResponse);
        });
      });

      describe('RedrivePolicy', () => {
        test('throw an error when RedrivePolicy missing deadLetterTargetArn', async () => {
          const params = {
            Attributes: { RedrivePolicy: '{"maxReceiveCount":"1000"}' },
            QueueName: 'foo-bar'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Value {"maxReceiveCount":"1000"} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
          );
        });

        test('throw an error when RedrivePolicy missing maxReceiveCount', async () => {
          const params = {
            Attributes: {
              RedrivePolicy:
                '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue"}'
            },
            QueueName: 'foo-bar'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Value {"deadLetterTargetArn":"arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue"} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.'
          );
        });

        test('throw error when creating queue with same name but different deadLetterTargetArn', async () => {
          const deadLetterQueueParams1 = { QueueName: 'dead-letter-queue1' };
          const deadLetterQueueParams2 = { QueueName: 'dead-letter-queue2' };

          await client.createQueue(deadLetterQueueParams1).promise();
          await client.createQueue(deadLetterQueueParams2).promise();

          const queueParams1 = {
            Attributes: {
              RedrivePolicy:
                '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue1","maxReceiveCount": "10"}'
            },
            QueueName: 'foo-bar-123'
          };

          const queueParams2 = {
            Attributes: {
              RedrivePolicy:
                '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue2","maxReceiveCount": "10"}'
            },
            QueueName: 'foo-bar-123'
          };

          await client.createQueue(queueParams1).promise();
          await expect(client.createQueue(queueParams2).promise()).rejects.toThrow(
            'A queue already exists with the same name and a different value for attribute RedrivePolicy'
          );
        });

        test('throw error when creating queue with same name but different maxReceiveCount', async () => {
          const deadLetterQueueParams1 = { QueueName: 'dead-letter-queue1' };

          await client.createQueue(deadLetterQueueParams1).promise();

          const queueParams1 = {
            Attributes: {
              RedrivePolicy:
                '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue1","maxReceiveCount": "5"}'
            },
            QueueName: 'foo-bar-456'
          };

          const queueParams2 = {
            Attributes: {
              RedrivePolicy:
                '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue1","maxReceiveCount": "10"}'
            },
            QueueName: 'foo-bar-456'
          };

          await client.createQueue(queueParams1).promise();
          await expect(client.createQueue(queueParams2).promise()).rejects.toThrow(
            'A queue already exists with the same name and a different value for attribute RedrivePolicy'
          );
        });

        test('create queue with Redrive Policy', async () => {
          const paramsDlq = { QueueName: 'foo-bar-dlq' };
          await client.createQueue(paramsDlq).promise();

          const params = {
            Attributes: {
              RedrivePolicy:
                '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:queues:foo-bar-dlq","maxReceiveCount":10}'
            },
            QueueName: 'foo-bar'
          };

          const response = await client.createQueue(params).promise();

          expect(response).toEqual({
            QueueUrl: 'https://queue.amazonaws.com/queues/foo-bar',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('VisibilityTimeout', () => {
        test('throw an error when VisibilityTimeout is larger value than allowed', async () => {
          const params = {
            Attributes: { VisibilityTimeout: '43201' },
            QueueName: 'foo-bar-visibilityTimeout'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter VisibilityTimeout.'
          );
        });

        test('throw an error when VisibilityTimeout is lower value than allowed', async () => {
          const params = {
            Attributes: { VisibilityTimeout: '-1' },
            QueueName: 'foo-bar-visibilityTimeout'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter VisibilityTimeout.'
          );
        });

        test('create queue with VisibilityTimeout attribute', async () => {
          const params = {
            Attributes: { VisibilityTimeout: '30' },
            QueueName: 'foo-bar-visibilityTimeout'
          };
          const expectedResponse = {
            QueueUrl: 'https://queue.amazonaws.com/queues/foo-bar-visibilityTimeout',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          };
          await expect(client.createQueue(params).promise()).resolves.toEqual(expectedResponse);
        });
      });

      describe('KmsMasterKeyId', () => {
        /**
         * AWS seems to not verify value for KmsMasterKeyId
         */
        test('create queue with KmsMasterKeyId attribute', async () => {
          const params = {
            Attributes: { KmsMasterKeyId: 'foo' },
            QueueName: 'foo-bar-kmsMasterKeyId'
          };
          const expectedResponse = {
            QueueUrl: 'https://queue.amazonaws.com/queues/foo-bar-kmsMasterKeyId',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          };
          await expect(client.createQueue(params).promise()).resolves.toEqual(expectedResponse);
        });
      });

      describe('KmsDataKeyReusePeriodSeconds', () => {
        test('throw error when KmsDataKeyReusePeriodSeconds value is larger than allowed', async () => {
          const params = {
            Attributes: { KmsDataKeyReusePeriodSeconds: '86401' },
            QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter KmsDataKeyReusePeriodSeconds.'
          );
        });

        test('throw error when KmsDataKeyReusePeriodSeconds value is lower than allowed', async () => {
          const params = {
            Attributes: { KmsDataKeyReusePeriodSeconds: '59' },
            QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
          };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'Invalid value for the parameter KmsDataKeyReusePeriodSeconds.'
          );
        });

        test('create queue with KmsDataKeyReusePeriodSeconds attribute', async () => {
          const params = {
            Attributes: { KmsDataKeyReusePeriodSeconds: '60' },
            QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
          };
          const expectedResponse = {
            QueueUrl: 'https://queue.amazonaws.com/queues/foo-bar-kmsDataKeyReusePeriodSeconds',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          };
          await expect(client.createQueue(params).promise()).resolves.toEqual(expectedResponse);
        });
      });

      describe('FifoQueue', () => {
        test('throw an error when attempting to create fifo queue with no .fifo postfix', async () => {
          const params = { Attributes: { FifoQueue: 'true' }, QueueName: 'foo-bar' };
          await expect(client.createQueue(params).promise()).rejects.toThrow(
            'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.'
          );
        });
      });

      describe('Attribute Errors', () => {
        test('QueueAlreadyExists when trying to create duplicate queue with different params', async () => {
          const params = { Attributes: { DelaySeconds: '100' }, QueueName: 'test-duplicate' };
          await client.createQueue(params).promise();

          const params1 = {
            Attributes: { DelaySeconds: '100', VisibilityTimeout: '500' },
            QueueName: 'test-duplicate'
          };
          await expect(client.createQueue(params1).promise()).rejects.toThrow(
            'A queue already exists with the same name and a different value for attribute VisibilityTimeout'
          );
        });
      });
    });

    describe('Tags', () => {
      test('successfully create queue with tags', async () => {
        const params = { QueueName: 'foo-bar-with-tags', tags: { foo: 'bar', foo1: 'bar1' } };
        const expectedResponse = {
          QueueUrl: 'https://queue.amazonaws.com/queues/foo-bar-with-tags',
          ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
        };
        await expect(client.createQueue(params).promise()).resolves.toEqual(expectedResponse);
      });
    });

    test('throw error when attempting to set ContentBasedDeduplication, with a non FIFO queue', async () => {
      const params = { Attributes: { ContentBasedDeduplication: 'true' }, QueueName: 'foo-bar' };
      await expect(client.createQueue(params).promise()).rejects.toThrow(
        'Unknown Attribute ContentBasedDeduplication.'
      );
    });
  });

  describe('sendMessage', () => {
    test('successfully send message', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await expect(
        client
          .sendMessage({
            MessageBody: 'foo',
            QueueUrl: `${endpoint}/queues/core-test`
          })
          .promise()
      ).resolves.toEqual({
        MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
        MessageId: expect.any(String),
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test('throw error when queue does not exist', async () => {
      await expect(
        client
          .sendMessage({
            MessageBody: 'some message',
            QueueUrl: `${endpoint}/queues/foo-bar123`
          })
          .promise()
      ).rejects.toThrow('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('receiveMessage', () => {
    test('successfully receive message', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({ MessageBody: 'foo', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();
      await expect(
        client.receiveMessage({ QueueUrl: `${endpoint}/queues/core-test` }).promise()
      ).resolves.toEqual({
        Messages: [
          {
            Body: 'foo',
            MD5OfBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
            MessageId: expect.any(String),
            ReceiptHandle: '0000000'
          }
        ],
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test('successfully receive multiple messages', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({ MessageBody: 'foo1', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();
      await client
        .sendMessage({ MessageBody: 'foo2', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();
      await client
        .sendMessage({ MessageBody: 'foo3', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();

      await expect(
        client
          .receiveMessage({ MaxNumberOfMessages: 3, QueueUrl: `${endpoint}/queues/core-test` })
          .promise()
      ).resolves.toEqual({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageId: expect.any(String),
            ReceiptHandle: '0000000'
          },
          {
            Body: 'foo2',
            MD5OfBody: '92e0057157f69e22a364d6b22dd6bbd5',
            MessageId: expect.any(String),
            ReceiptHandle: '0000000'
          },
          {
            Body: 'foo3',
            MD5OfBody: 'cecf7c1a4c5640928a3a73459bb3d977',
            MessageId: expect.any(String),
            ReceiptHandle: '0000000'
          }
        ],
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test('successfully receive multiple messages when there are less messages than requested', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({ MessageBody: 'foo1', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();
      await expect(
        client
          .receiveMessage({ MaxNumberOfMessages: 3, QueueUrl: `${endpoint}/queues/core-test` })
          .promise()
      ).resolves.toEqual({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageId: expect.any(String),
            ReceiptHandle: '0000000'
          }
        ],
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test('return no messages when there are no messages to return', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await expect(
        client
          .receiveMessage({ MaxNumberOfMessages: 1, QueueUrl: `${endpoint}/queues/core-test` })
          .promise()
      ).resolves.toEqual({
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test.only('receive messages with message attributes', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({
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
          QueueUrl: `${endpoint}/queues/core-test`
        })
        .promise();

      const res = await client
        .receiveMessage({
          MaxNumberOfMessages: 1,
          MessageAttributeNames: ['All'],
          QueueUrl: `${endpoint}/queues/core-test`
        })
        .promise();

      console.log(res);
      expect(true).toBe(false);
      // await expect(
      //   client
      //     .receiveMessage({
      //       MaxNumberOfMessages: 1,
      //       'MessageAttributeName.1': 'All',
      //       QueueUrl: `${endpoint}/queues/core-test`
      //     })
      //     .promise()
      // ).resolves.toEqual({
      //   ResponseMetadata: {
      //     RequestId: '00000000-0000-0000-0000-000000000000'
      //   }
      // });
    });
  });

  describe('Default Option', () => {
    test('result to default option when Action is not implemented', () => {
      expect.assertions(1);
      const http = require('http');
      const body = 'Action=foo';

      return new Promise(resolve => {
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
          res => {
            res.on('data', chunk => {
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
