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
        expect.assertions(1);
        const params = {
          QueueName:
            '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
        };

        try {
          await client.createQueue(params).promise();
        } catch (err) {
          expect(err.message).toEqual(
            'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
          );
        }
      });

      test('throw an error when queue name has invalid characters', async () => {
        expect.assertions(1);
        const params = {
          QueueName: 'abc@'
        };

        try {
          await client.createQueue(params).promise();
        } catch (err) {
          expect(err.message).toEqual(
            'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
          );
        }
      });

      test('successfully create queue', async () => {
        const params = {
          QueueName: 'foo-bar'
        };

        const expectedResult = {
          QueueUrl: 'https://queue.amazonaws.com/123/foo-bar',
          ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
        };
        const result = await client.createQueue(params).promise();
        expect(result).toEqual(expectedResult);
      });
    });

    describe('Attributes', () => {
      describe('DelaySeconds', () => {
        test('throw error when DelaySeconds is larger than allowed', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              DelaySeconds: '901'
            },
            QueueName: 'foo-bar-delaySeconds'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual('Invalid value for the parameter DelaySeconds.');
          }
        });

        test('throw error when DelaySeconds is lower than allowed', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              DelaySeconds: '-1'
            },
            QueueName: 'foo-bar-delaySeconds'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual('Invalid value for the parameter DelaySeconds.');
          }
        });

        test('create queue with DelaySeconds attribute', async () => {
          const params = {
            Attributes: {
              DelaySeconds: '10'
            },
            QueueName: 'foo-bar-delaySeconds'
          };

          const response = await client.createQueue(params).promise();
          expect(response).toEqual({
            QueueUrl: 'https://queue.amazonaws.com/123/foo-bar-delaySeconds',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('MaximumMessageSize', () => {
        test('throw error when MaximumMessageSize is larger than allowed value', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              MaximumMessageSize: '262145'
            },
            QueueName: 'foo-bar-maximumMessageSize'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual('Invalid value for the parameter MaximumMessageSize.');
          }
        });

        test('throw error when MaximumMessageSize is lower than allowed value', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              MaximumMessageSize: '1023'
            },
            QueueName: 'foo-bar-maximumMessageSize'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual('Invalid value for the parameter MaximumMessageSize.');
          }
        });

        test('create queue with MaximumMessageSize', async () => {
          const params = {
            Attributes: {
              MaximumMessageSize: '1024'
            },
            QueueName: 'foo-bar-maximumMessageSize'
          };

          const response = await client.createQueue(params).promise();
          expect(response).toEqual({
            QueueUrl: 'https://queue.amazonaws.com/123/foo-bar-maximumMessageSize',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('MessageRetentionPeriod', () => {
        /**
         * aws sqs create-queue --queue-name=foo-bar-messageRetentionPeriod --attributes MessageRetentionPeriod=1209601 --region=us-east-1 --debug
         */
        test('throw an error when MessageRetentionPeriod larger than allowed', async () => {
          const params = {
            Attributes: {
              MessageRetentionPeriod: '1209601'
            },
            QueueName: 'foo-bar-messageRetentionPeriod'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual('Invalid value for the parameter MessageRetentionPeriod.');
          }
        });

        test('throw an error when MessageRetentionPeriod lower than allowed', async () => {
          const params = {
            Attributes: {
              MessageRetentionPeriod: '59'
            },
            QueueName: 'foo-bar-messageRetentionPeriod'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual('Invalid value for the parameter MessageRetentionPeriod.');
          }
        });

        test('throw an error when MessageRetentionPeriod lower than allowed', async () => {
          const params = {
            Attributes: {
              MessageRetentionPeriod: '60'
            },
            QueueName: 'foo-bar-messageRetentionPeriod'
          };

          const response = await client.createQueue(params).promise();
          expect(response).toEqual({
            QueueUrl: 'https://queue.amazonaws.com/123/foo-bar-messageRetentionPeriod',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      // TODO: Add tests for Policy attribute, when functionality implemented

      describe('ReceiveMessageWaitTimeSeconds', () => {
        /**
         * ws sqs create-queue --queue-name=foo-bar-receiveMessageWaitTimeSeconds --attributes ReceiveMessageWaitTimeSeconds=21 --region=us-east-1 --debug
         */
        test('throw an error when ReceiveMessageWaitTimeSeconds is larger value than allowed', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              ReceiveMessageWaitTimeSeconds: '21'
            },
            QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual(
              'Invalid value for the parameter ReceiveMessageWaitTimeSeconds.'
            );
          }
        });

        test('throw an error when ReceiveMessageWaitTimeSeconds is lower value than allowed', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              ReceiveMessageWaitTimeSeconds: '-1'
            },
            QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual(
              'Invalid value for the parameter ReceiveMessageWaitTimeSeconds.'
            );
          }
        });

        test('create queue with ReceiveMessageWaitTimeSeconds', async () => {
          const params = {
            Attributes: {
              ReceiveMessageWaitTimeSeconds: '0'
            },
            QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
          };

          const response = await client.createQueue(params).promise();

          expect(response).toEqual({
            QueueUrl: 'https://queue.amazonaws.com/123/foo-bar-receiveMessageWaitTimeSeconds',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('RedrivePolicy', () => {
        test('throw an error when RedrivePolicy missing deadLetterTargetArn', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              RedrivePolicy: '{"maxReceiveCount":"1000"}'
            },
            QueueName: 'foo-bar'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqualXML(
              'Value {"maxReceiveCount":"1000"} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
            );
          }
        });

        test('throw an error when RedrivePolicy missing maxReceiveCount', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              RedrivePolicy:
                '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue"}'
            },
            QueueName: 'foo-bar'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual(
              'Value {"deadLetterTargetArn":"arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue"} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.'
            );
          }
        });

        // TODO: add test for successfull redrive policy creation
      });

      describe('VisibilityTimeout', () => {
        test('throw an error when VisibilityTimeout is larger value than allowed', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              VisibilityTimeout: '43201'
            },
            QueueName: 'foo-bar-visibilityTimeout'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual('Invalid value for the parameter VisibilityTimeout.');
          }
        });

        test('throw an error when VisibilityTimeout is lower value than allowed', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              VisibilityTimeout: '-1'
            },
            QueueName: 'foo-bar-visibilityTimeout'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual('Invalid value for the parameter VisibilityTimeout.');
          }
        });

        test('create queue with VisibilityTimeout attribute', async () => {
          const params = {
            Attributes: {
              VisibilityTimeout: '30'
            },
            QueueName: 'foo-bar-visibilityTimeout'
          };

          const response = await client.createQueue(params).promise();
          expect(response).toEqual({
            QueueUrl: 'https://queue.amazonaws.com/123/foo-bar-visibilityTimeout',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('KmsMasterKeyId', () => {
        /**
         * AWS seems to not verify value for KmsMasterKeyId
         */
        test('create queue with KmsMasterKeyId attribute', async () => {
          const params = {
            Attributes: {
              KmsMasterKeyId: 'foo'
            },
            QueueName: 'foo-bar-kmsMasterKeyId'
          };

          const response = await client.createQueue(params).promise();

          expect(response).toEqual({
            QueueUrl: 'https://queue.amazonaws.com/123/foo-bar-kmsMasterKeyId',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('KmsDataKeyReusePeriodSeconds', () => {
        test('throw error when KmsDataKeyReusePeriodSeconds value is larger than allowed', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              KmsDataKeyReusePeriodSeconds: '86401'
            },
            QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual(
              'Invalid value for the parameter KmsDataKeyReusePeriodSeconds.'
            );
          }
        });

        test('throw error when KmsDataKeyReusePeriodSeconds value is lower than allowed', async () => {
          expect.assertions(1);
          const params = {
            Attributes: {
              KmsDataKeyReusePeriodSeconds: '59'
            },
            QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual(
              'Invalid value for the parameter KmsDataKeyReusePeriodSeconds.'
            );
          }
        });

        test('create queue with KmsDataKeyReusePeriodSeconds attribute', async () => {
          const params = {
            Attributes: {
              KmsDataKeyReusePeriodSeconds: '60'
            },
            QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
          };

          const response = await client.createQueue(params).promise();
          expect(response).toEqual({
            QueueUrl: 'https://queue.amazonaws.com/123/foo-bar-kmsDataKeyReusePeriodSeconds',
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('FifoQueue', () => {
        test('throw an error when attempting to create fifo queue with no .fifo postfix', async () => {
          const params = {
            Attributes: {
              FifoQueue: 'true'
            },
            QueueName: 'foo-bar'
          };

          try {
            await client.createQueue(params).promise();
          } catch (err) {
            expect(err.message).toEqual(
              'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.'
            );
          }
        });
      });

      describe('Attribute Errors', () => {
        test('QueueAlreadyExists when trying to create duplicate queue with different params', async () => {
          const params = {
            Attributes: {
              DelaySeconds: '100'
            },
            QueueName: 'test-duplicate'
          };

          await client.createQueue(params).promise();

          const params1 = {
            Attributes: {
              DelaySeconds: '100',
              VisibilityTimeout: '500'
            },
            QueueName: 'test-duplicate'
          };

          try {
            await client.createQueue(params1).promise();
          } catch (err) {
            expect(err.message).toEqual(
              'A queue already exists with the same name and a different value for attribute VisibilityTimeout'
            );
          }
        });

        // TODO: add test for QueueDeletedRecently, when delete queue implemented
      });
    });

    describe('Tags', () => {
      test('successfully create queue with tags', async () => {
        const params = {
          QueueName: 'foo-bar-with-tags',
          tags: {
            foo: 'bar',
            foo1: 'bar1'
          }
        };

        const result = await client.createQueue(params).promise();
        expect(result).toEqual({
          QueueUrl: 'https://queue.amazonaws.com/123/foo-bar-with-tags',
          ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
        });
      });
    });

    test('throw error when attempting to set ContentBasedDeduplication, with a non FIFO queue', async () => {
      expect.assertions(1);
      const params = {
        Attributes: {
          ContentBasedDeduplication: 'true'
        },
        QueueName: 'foo-bar'
      };

      try {
        await client.createQueue(params).promise();
      } catch (err) {
        expect(err.message).toEqual('Unknown Attribute ContentBasedDeduplication.');
      }
    });
  });

  afterAll(() => {
    sqsLiteServer.stop(); // TODO: verify correct stop
  });
});
