'use strict';

const { Queue } = require('./validations');

describe('utils/validations', () => {
  describe('QueueName', () => {
    test('throw an error when QueueName is too long', () => {
      expect(() =>
        Queue({
          QueueName:
            '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
        })
      ).toThrow(
        'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
      );
    });

    test('throw an error when QueueName has invalid characters', () => {
      expect(() => Queue({ QueueName: 'foo%^' })).toThrow(
        'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
      );
    });

    test('successfully create queue with default params', () => {
      expect(Queue({ QueueName: 'foo-bar' })).toEqual({
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
          Queue({ Attributes: { ContentBasedDeduplication: 'foo' }, QueueName: 'foo-bar' })
        ).toThrow(
          'Expected a value of type `boolean | undefined` for `Attributes.ContentBasedDeduplication` but received `"foo"`.'
        );
      });
      test('create queue with ContentBasedDeduplication', () => {
        expect(
          Queue({ Attributes: { ContentBasedDeduplication: true }, QueueName: 'foo-bar' })
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
        expect(() => Queue({ Attributes: { DelaySeconds: -1 }, QueueName: 'foo-bar' })).toThrow(
          'Invalid value for the parameter DelaySeconds.'
        );
      });
      test('throw error when DelaySeconds is larger than allowed', () => {
        expect(() => Queue({ Attributes: { DelaySeconds: 901 }, QueueName: 'foo-bar' })).toThrow(
          'Invalid value for the parameter DelaySeconds.'
        );
      });
      test('create queue with custom value for DelaySeconds', () => {
        expect(Queue({ Attributes: { DelaySeconds: 100 }, QueueName: 'foo-bar' })).toEqual({
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
        expect(() => Queue({ Attributes: { FifoQueue: 'foo' }, QueueName: 'foo-bar' })).toThrow(
          'Expected a value of type `boolean` for `Attributes.FifoQueue` but received `"foo"`.'
        );
      });
      test('successfully create queue with FifoQueue', () => {
        expect(Queue({ Attributes: { FifoQueue: true }, QueueName: 'foo-bar' })).toEqual({
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
          Queue({ Attributes: { KmsDataKeyReusePeriodSeconds: 59 }, QueueName: 'foo-bar' })
        ).toThrow('Invalid value for the parameter KmsDataKeyReusePeriodSeconds.');
      });

      test('throw error when KmsDataKeyReusePeriodSeconds is larger than allowed', () => {
        expect(() =>
          Queue({ Attributes: { KmsDataKeyReusePeriodSeconds: 86401 }, QueueName: 'foo-bar' })
        ).toThrow('Invalid value for the parameter KmsDataKeyReusePeriodSeconds.');
      });

      test('successfully create queue with custom KmsDataKeyReusePeriodSeconds', () => {
        expect(
          Queue({ Attributes: { KmsDataKeyReusePeriodSeconds: 500 }, QueueName: 'foo-bar' })
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
        expect(() => Queue({ Attributes: { KmsMasterKeyId: true }, QueueName: 'foo-bar' })).toThrow(
          'Expected a value of type `string` for `Attributes.KmsMasterKeyId` but received `true`.'
        );
      });

      test('create queue with custom KmsMasterKeyId', () => {
        expect(Queue({ Attributes: { KmsMasterKeyId: 'testId' }, QueueName: 'foo-bar' })).toEqual({
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
          Queue({ Attributes: { MaximumMessageSize: 1023 }, QueueName: 'foo-bar' })
        ).toThrow('Invalid value for the parameter MaximumMessageSize.');
      });
      test('throw error when MaximumMessageSize is larger than allowed', () => {
        expect(() =>
          Queue({ Attributes: { MaximumMessageSize: 262145 }, QueueName: 'foo-bar' })
        ).toThrow('Invalid value for the parameter MaximumMessageSize.');
      });
      test('create queue with custom MaximumMessageSize', () => {
        expect(Queue({ Attributes: { MaximumMessageSize: 2000 }, QueueName: 'foo-bar' })).toEqual({
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
          Queue({ Attributes: { MessageRetentionPeriod: 59 }, QueueName: 'foo-bar' })
        ).toThrow('Invalid value for the parameter MessageRetentionPeriod.');
      });

      test('throw error when MessageRetentionPeriod is larger than allowed', () => {
        expect(() =>
          Queue({ Attributes: { MessageRetentionPeriod: 1209601 }, QueueName: 'foo-bar' })
        ).toThrow('Invalid value for the parameter MessageRetentionPeriod.');
      });

      test('create queue with custom MessageRetentionPeriod', () => {
        expect(Queue({ Attributes: { MessageRetentionPeriod: 70 }, QueueName: 'foo-bar' })).toEqual(
          {
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
          }
        );
      });
    });
    describe('ReceiveMessageWaitTimeSeconds', () => {
      test('throw error when ReceiveMessageWaitTimeSeconds is smaller than allowed', () => {
        expect(() =>
          Queue({ Attributes: { ReceiveMessageWaitTimeSeconds: -1 }, QueueName: 'foo-bar' })
        ).toThrow('Invalid value for the parameter ReceiveMessageWaitTimeSeconds.');
      });

      test('throw error when ReceiveMessageWaitTimeSeconds is larger than allowed', () => {
        expect(() =>
          Queue({ Attributes: { ReceiveMessageWaitTimeSeconds: 21 }, QueueName: 'foo-bar' })
        ).toThrow('Invalid value for the parameter ReceiveMessageWaitTimeSeconds.');
      });

      test('create queue with custom ReceiveMessageWaitTimeSeconds', () => {
        expect(
          Queue({ Attributes: { ReceiveMessageWaitTimeSeconds: 10 }, QueueName: 'foo-bar' })
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
        expect(Queue({ Attributes: {}, QueueName: 'foo-bar' })).toEqual({
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
          Queue({ Attributes: { RedrivePolicy: { maxReceiveCount: 10 } }, QueueName: 'foo-bar' })
        ).toThrow(
          'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
        );
      });

      test('throw error when RedrivePolicy missing maxReceiveCount', () => {
        expect(() =>
          Queue({
            Attributes: { RedrivePolicy: { deadLetterTargetArn: 'arn' } },
            QueueName: 'foo-bar'
          })
        ).toThrow(
          'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.'
        );
      });

      test('successfully create queue with RedrivePolicy', () => {
        expect(
          Queue({
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
          Queue({ Attributes: { VisibilityTimeout: -1 }, QueueName: 'foo-bar' })
        ).toThrow('Invalid value for the parameter VisibilityTimeout.');
      });

      test('throw error when VisibilityTimeout is larger than allowed', () => {
        expect(() =>
          Queue({ Attributes: { VisibilityTimeout: 43201 }, QueueName: 'foo-bar' })
        ).toThrow('Invalid value for the parameter VisibilityTimeout.');
      });

      test('create queue with custom VisibilityTimeout', () => {
        expect(Queue({ Attributes: { VisibilityTimeout: 40 }, QueueName: 'foo-bar' })).toEqual({
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
      expect(() => Queue({ QueueName: 'foo-bar', tags: 'foo' })).toThrow(
        'Expected a value of type `object | undefined` for `tags` but received `"foo"`.'
      );
    });

    test('create queue with tags', () => {
      expect(Queue({ QueueName: 'foo-bar', tags: { tag1: 'name1' } })).toEqual({
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
