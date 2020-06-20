'use strict';

const { assertMessage, assertQueue } = require('./validations');

describe('utils/validations', () => {
  describe('Queue', () => {
    describe('QueueName', () => {
      test('throw an error when QueueName is too long', () => {
        expect(() =>
          assertQueue({
            QueueName:
              '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
          })
        ).toThrow(
          'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
        );
      });

      test('throw an error when QueueName has invalid characters', () => {
        expect(() => assertQueue({ QueueName: 'foo%^' })).toThrow(
          'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
        );
      });

      test('successfully create queue with default params', () => {
        expect(assertQueue({ QueueName: 'foo-bar' })).toEqual({
          Attributes: {
            DelaySeconds: 0,
            FifoQueue: false,
            KmsDataKeyReusePeriodSeconds: 300,
            KmsMasterKeyId: 'alias/aws/sqs',
            MaximumMessageSize: 262144,
            MessageRetentionPeriod: 345600,
            ReceiveMessageWaitTimeSeconds: 0,
            VisibilityTimeout: 30
          },
          QueueName: 'foo-bar'
        });
      });
    });

    describe('Attributes', () => {
      describe('ContentBasedDeduplication', () => {
        test('throw error when ContentBasedDeduplication is wrong type', () => {
          expect(() =>
            assertQueue({ Attributes: { ContentBasedDeduplication: 'foo' }, QueueName: 'foo-bar' })
          ).toThrow(
            'Expected a value of type `boolean` for `ContentBasedDeduplication` but received `"foo"`.'
          );
        });
        test('create queue with ContentBasedDeduplication', () => {
          expect(
            assertQueue({ Attributes: { ContentBasedDeduplication: true }, QueueName: 'foo-bar' })
          ).toEqual({
            Attributes: {
              ContentBasedDeduplication: true,
              DelaySeconds: 0,
              FifoQueue: false,
              KmsDataKeyReusePeriodSeconds: 300,
              KmsMasterKeyId: 'alias/aws/sqs',
              MaximumMessageSize: 262144,
              MessageRetentionPeriod: 345600,
              ReceiveMessageWaitTimeSeconds: 0,
              VisibilityTimeout: 30
            },
            QueueName: 'foo-bar'
          });
        });
      });

      describe('DelaySeconds', () => {
        test('throw error when DelaySeconds is smaller than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { DelaySeconds: -1 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter DelaySeconds.');
        });
        test('throw error when DelaySeconds is larger than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { DelaySeconds: 901 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter DelaySeconds.');
        });
        test('create queue with custom value for DelaySeconds', () => {
          expect(assertQueue({ Attributes: { DelaySeconds: 100 }, QueueName: 'foo-bar' })).toEqual({
            Attributes: {
              DelaySeconds: 100,
              FifoQueue: false,
              KmsDataKeyReusePeriodSeconds: 300,
              KmsMasterKeyId: 'alias/aws/sqs',
              MaximumMessageSize: 262144,
              MessageRetentionPeriod: 345600,
              ReceiveMessageWaitTimeSeconds: 0,
              VisibilityTimeout: 30
            },
            QueueName: 'foo-bar'
          });
        });
      });

      describe('FifoQueue', () => {
        test('throw error when FifoQueue is wrong type', () => {
          expect(() =>
            assertQueue({ Attributes: { FifoQueue: 'foo' }, QueueName: 'foo-bar' })
          ).toThrow('Expected a value of type `boolean` for `FifoQueue` but received `"foo"`.');
        });
        test('successfully create queue with FifoQueue', () => {
          expect(assertQueue({ Attributes: { FifoQueue: true }, QueueName: 'foo-bar' })).toEqual({
            Attributes: {
              DelaySeconds: 0,
              FifoQueue: true,
              KmsDataKeyReusePeriodSeconds: 300,
              KmsMasterKeyId: 'alias/aws/sqs',
              MaximumMessageSize: 262144,
              MessageRetentionPeriod: 345600,
              ReceiveMessageWaitTimeSeconds: 0,
              VisibilityTimeout: 30
            },
            QueueName: 'foo-bar'
          });
        });
      });

      describe('KmsDataKeyReusePeriodSeconds', () => {
        test('throw error when KmsDataKeyReusePeriodSeconds is smaller than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { KmsDataKeyReusePeriodSeconds: 59 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter KmsDataKeyReusePeriodSeconds.');
        });

        test('throw error when KmsDataKeyReusePeriodSeconds is larger than allowed', () => {
          expect(() =>
            assertQueue({
              Attributes: { KmsDataKeyReusePeriodSeconds: 86401 },
              QueueName: 'foo-bar'
            })
          ).toThrow('Invalid value for the parameter KmsDataKeyReusePeriodSeconds.');
        });

        test('successfully create queue with custom KmsDataKeyReusePeriodSeconds', () => {
          expect(
            assertQueue({ Attributes: { KmsDataKeyReusePeriodSeconds: 500 }, QueueName: 'foo-bar' })
          ).toEqual({
            Attributes: {
              DelaySeconds: 0,
              FifoQueue: false,
              KmsDataKeyReusePeriodSeconds: 500,
              KmsMasterKeyId: 'alias/aws/sqs',
              MaximumMessageSize: 262144,
              MessageRetentionPeriod: 345600,
              ReceiveMessageWaitTimeSeconds: 0,
              VisibilityTimeout: 30
            },
            QueueName: 'foo-bar'
          });
        });
      });

      describe('KmsMasterKeyId', () => {
        test('throw error when KmsMasterKeyId is wrong type', () => {
          expect(() =>
            assertQueue({ Attributes: { KmsMasterKeyId: true }, QueueName: 'foo-bar' })
          ).toThrow('Expected a value of type `string` for `KmsMasterKeyId` but received `true`.');
        });

        test('create queue with custom KmsMasterKeyId', () => {
          expect(
            assertQueue({ Attributes: { KmsMasterKeyId: 'testId' }, QueueName: 'foo-bar' })
          ).toEqual({
            Attributes: {
              DelaySeconds: 0,
              FifoQueue: false,
              KmsDataKeyReusePeriodSeconds: 300,
              KmsMasterKeyId: 'testId',
              MaximumMessageSize: 262144,
              MessageRetentionPeriod: 345600,
              ReceiveMessageWaitTimeSeconds: 0,
              VisibilityTimeout: 30
            },
            QueueName: 'foo-bar'
          });
        });
      });

      describe('MaximumMessageSize', () => {
        test('throw error when MaximumMessageSize is smaller than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { MaximumMessageSize: 1023 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter MaximumMessageSize.');
        });
        test('throw error when MaximumMessageSize is larger than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { MaximumMessageSize: 262145 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter MaximumMessageSize.');
        });
        test('create queue with custom MaximumMessageSize', () => {
          expect(
            assertQueue({ Attributes: { MaximumMessageSize: 2000 }, QueueName: 'foo-bar' })
          ).toEqual({
            Attributes: {
              DelaySeconds: 0,
              FifoQueue: false,
              KmsDataKeyReusePeriodSeconds: 300,
              KmsMasterKeyId: 'alias/aws/sqs',
              MaximumMessageSize: 2000,
              MessageRetentionPeriod: 345600,
              ReceiveMessageWaitTimeSeconds: 0,
              VisibilityTimeout: 30
            },
            QueueName: 'foo-bar'
          });
        });
      });

      describe('MessageRetentionPeriod', () => {
        test('throw error when MessageRetentionPeriod is smaller than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { MessageRetentionPeriod: 59 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter MessageRetentionPeriod.');
        });

        test('throw error when MessageRetentionPeriod is larger than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { MessageRetentionPeriod: 1209601 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter MessageRetentionPeriod.');
        });

        test('create queue with custom MessageRetentionPeriod', () => {
          expect(
            assertQueue({ Attributes: { MessageRetentionPeriod: 70 }, QueueName: 'foo-bar' })
          ).toEqual({
            Attributes: {
              DelaySeconds: 0,
              FifoQueue: false,
              KmsDataKeyReusePeriodSeconds: 300,
              KmsMasterKeyId: 'alias/aws/sqs',
              MaximumMessageSize: 262144,
              MessageRetentionPeriod: 70,
              ReceiveMessageWaitTimeSeconds: 0,
              VisibilityTimeout: 30
            },
            QueueName: 'foo-bar'
          });
        });
      });
      describe('ReceiveMessageWaitTimeSeconds', () => {
        test('throw error when ReceiveMessageWaitTimeSeconds is smaller than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { ReceiveMessageWaitTimeSeconds: -1 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter ReceiveMessageWaitTimeSeconds.');
        });

        test('throw error when ReceiveMessageWaitTimeSeconds is larger than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { ReceiveMessageWaitTimeSeconds: 21 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter ReceiveMessageWaitTimeSeconds.');
        });

        test('create queue with custom ReceiveMessageWaitTimeSeconds', () => {
          expect(
            assertQueue({ Attributes: { ReceiveMessageWaitTimeSeconds: 10 }, QueueName: 'foo-bar' })
          ).toEqual({
            Attributes: {
              DelaySeconds: 0,
              FifoQueue: false,
              KmsDataKeyReusePeriodSeconds: 300,
              KmsMasterKeyId: 'alias/aws/sqs',
              MaximumMessageSize: 262144,
              MessageRetentionPeriod: 345600,
              ReceiveMessageWaitTimeSeconds: 10,
              VisibilityTimeout: 30
            },
            QueueName: 'foo-bar'
          });
        });
      });

      describe('RedrivePolicy', () => {
        test('create queue when RedrivePolicy is empty', () => {
          expect(assertQueue({ Attributes: {}, QueueName: 'foo-bar' })).toEqual({
            Attributes: {
              DelaySeconds: 0,
              FifoQueue: false,
              KmsDataKeyReusePeriodSeconds: 300,
              KmsMasterKeyId: 'alias/aws/sqs',
              MaximumMessageSize: 262144,
              MessageRetentionPeriod: 345600,
              ReceiveMessageWaitTimeSeconds: 0,
              VisibilityTimeout: 30
            },
            QueueName: 'foo-bar'
          });
        });
        test('throw error when RedrivePolicy missing deadLetterTargetArn', () => {
          expect(() =>
            assertQueue({
              Attributes: { RedrivePolicy: { maxReceiveCount: 10 } },
              QueueName: 'foo-bar'
            })
          ).toThrow(
            'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
          );
        });

        test('throw error when RedrivePolicy missing maxReceiveCount', () => {
          expect(() =>
            assertQueue({
              Attributes: { RedrivePolicy: { deadLetterTargetArn: 'arn' } },
              QueueName: 'foo-bar'
            })
          ).toThrow(
            'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.'
          );
        });

        test('successfully create queue with RedrivePolicy', () => {
          expect(
            assertQueue({
              Attributes: { RedrivePolicy: { deadLetterTargetArn: 'arn', maxReceiveCount: 10 } },
              QueueName: 'foo-bar'
            })
          ).toEqual({
            Attributes: {
              DelaySeconds: 0,
              FifoQueue: false,
              KmsDataKeyReusePeriodSeconds: 300,
              KmsMasterKeyId: 'alias/aws/sqs',
              MaximumMessageSize: 262144,
              MessageRetentionPeriod: 345600,
              ReceiveMessageWaitTimeSeconds: 0,
              RedrivePolicy: {
                deadLetterTargetArn: 'arn',
                maxReceiveCount: 10
              },
              VisibilityTimeout: 30
            },
            QueueName: 'foo-bar'
          });
        });
      });

      describe('VisibilityTimeout', () => {
        test('throw error when VisibilityTimeout is smaller than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { VisibilityTimeout: -1 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter VisibilityTimeout.');
        });

        test('throw error when VisibilityTimeout is larger than allowed', () => {
          expect(() =>
            assertQueue({ Attributes: { VisibilityTimeout: 43201 }, QueueName: 'foo-bar' })
          ).toThrow('Invalid value for the parameter VisibilityTimeout.');
        });

        test('create queue with custom VisibilityTimeout', () => {
          expect(
            assertQueue({ Attributes: { VisibilityTimeout: 40 }, QueueName: 'foo-bar' })
          ).toEqual({
            Attributes: {
              DelaySeconds: 0,
              FifoQueue: false,
              KmsDataKeyReusePeriodSeconds: 300,
              KmsMasterKeyId: 'alias/aws/sqs',
              MaximumMessageSize: 262144,
              MessageRetentionPeriod: 345600,
              ReceiveMessageWaitTimeSeconds: 0,
              VisibilityTimeout: 40
            },
            QueueName: 'foo-bar'
          });
        });
      });
    });

    describe('Tags', () => {
      test('throw error when tags is invalid type', () => {
        expect(() => assertQueue({ QueueName: 'foo-bar', tags: 'foo' })).toThrow(
          'Expected a value of type `Object` but received `"foo"`.'
        );
      });

      test('create queue with tags', () => {
        expect(assertQueue({ QueueName: 'foo-bar', tags: { tag1: 'name1' } })).toEqual({
          Attributes: {
            DelaySeconds: 0,
            FifoQueue: false,
            KmsDataKeyReusePeriodSeconds: 300,
            KmsMasterKeyId: 'alias/aws/sqs',
            MaximumMessageSize: 262144,
            MessageRetentionPeriod: 345600,
            ReceiveMessageWaitTimeSeconds: 0,
            VisibilityTimeout: 30
          },
          QueueName: 'foo-bar',
          tags: {
            tag1: 'name1'
          }
        });
      });
    });
  });
  describe('Message', () => {
    describe('DelaySeconds', () => {
      test('set DelaySeconds correctly with custom DelaySeconds', () => {
        const params = { DelaySeconds: 10, MessageBody: 'foo', QueueUrl: 'bar' };
        expect(assertMessage(params)).toEqual({
          DelaySeconds: 10,
          MessageBody: 'foo',
          QueueUrl: 'bar'
        });
      });

      test('dont set DelaySeconds when not provided', () => {
        const params = { MessageBody: 'foo', QueueUrl: 'bar' };
        expect(assertMessage(params)).toEqual({
          MessageBody: 'foo',
          QueueUrl: 'bar'
        });
      });
      test('throw error when DelaySeconds is less than allowed', () => {
        const params = { DelaySeconds: -1, MessageBody: 'foo', QueueUrl: 'bar' };
        expect(() => assertMessage(params)).toThrow(
          'Invalid value for the parameter DelaySeconds.'
        );
      });

      test('throw error when DelaySeconds is more than allowed', () => {
        const params = { DelaySeconds: 901, MessageBody: 'foo', QueueUrl: 'bar' };
        expect(() => assertMessage(params)).toThrow(
          'Invalid value for the parameter DelaySeconds.'
        );
      });
    });
  });
});
