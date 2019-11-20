'use strict';

require('jest-xml-matcher');

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

      const expectedResult = `<CreateQueueResponse>
      <CreateQueueResult>
      <QueueUrl>https://queue.amazonaws.com/123/foo-bar</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
      <RequestId>7a62c49f-347e-4fc4-9331-6e8e7a96aa73</RequestId>
      </ResponseMetadata>
      </CreateQueueResponse>`;
      const result = createQueue(params);
      expect(result).toEqualXML(expectedResult);
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
      expect.assertions(1);
      const params = {
        Attributes: {
          DelaySeconds: 1000
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidAttributeValue</Code>
      <Message>Invalid value for the parameter DelaySeconds.</Message>
      <Detail/>
      </Error>
      <RequestId>bff16247-9ee2-50c4-be28-34083bcd2156</RequestId>
      </ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw error when MaximumMessageSize is invalid value', () => {
      expect.assertions(1);
      const params = {
        Attributes: {
          MaximumMessageSize: 262145
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidAttributeValue</Code>
      <Message>Invalid value for the parameter MaximumMessageSize.</Message>
      <Detail/>
      </Error><RequestId>889b0154-15cf-56c7-9dc2-571bb7b52432</RequestId>
      </ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw an error when MessageRetentionPeriod is invlid value', () => {
      const params = {
        Attributes: {
          MessageRetentionPeriod: 12096001
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeName</Code>
          <Message>Unknown Attribute messageRetentionPeriod.</Message>
          <Detail/>
        </Error>
        <RequestId>c69e516b-46d2-5759-af28-0724e6d14879</RequestId>
      </ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw an error when ReceiveMessageWaitTimeSeconds is invalid value', () => {
      expect.assertions(1);
      const params = {
        Attributes: {
          ReceiveMessageWaitTimeSeconds: 21
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidAttributeName</Code>
      <Message>Unknown Attribute receiveMessageWaitTimeSeconds.</Message>
      <Detail/>
      </Error>
      <RequestId>b78db8c9-5bdf-5c9b-97ad-ee86c7c82227</RequestId></ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw an error when VisibilityTimeout is invlid value', () => {
      expect.assertions(1);
      const params = {
        Attributes: {
          VisibilityTimeout: 43201
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidAttributeValue</Code>
      <Message>Invalid value for the parameter VisibilityTimeout.</Message>
      <Detail/>
      </Error>
      <RequestId>3a5aa982-6d39-50d6-8d21-ffcdf602b900</RequestId></ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
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

      const expectedResponse = `<CreateQueueResponse>
      <CreateQueueResult>
      <QueueUrl>https://queue.amazonaws.com/123/foo-with-dlq.fifo</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
      <RequestId>7a62c49f-347e-4fc4-9331-6e8e7a96aa73</RequestId>
      </ResponseMetadata>
      </CreateQueueResponse>`;

      expect(response).toEqualXML(expectedResponse);
    });

    test('throw error when KmsMasterKeyId is not set correctly', () => {
      const params = {
        Attributes: {
          KmsMasterKeyId: 'foo'
        },
        QueueName: 'foo-bar12'
      };

      const expectedResponse = `<CreateQueueResponse>
      <CreateQueueResult>
      <QueueUrl>https://queue.amazonaws.com/123/foo-bar12</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
      <RequestId>7a62c49f-347e-4fc4-9331-6e8e7a96aa73</RequestId>
      </ResponseMetadata>
      </CreateQueueResponse>`;

      const response = createQueue(params);
      expect(response).toEqualXML(expectedResponse);
    });

    test('throw error when KmsDataKeyReusePeriodSeconds is not set correctly', () => {
      expect.assertions(1);
      const params = {
        Attributes: {
          KmsDataKeyReusePeriodSeconds: 86401
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidAttributeValue</Code>
      <Message>Invalid value for the parameter KmsDataKeyReusePeriodSeconds.</Message>
      <Detail/>
      </Error>
      <RequestId>351aa1b4-15dd-5021-bffa-f7fbb1e53940</RequestId>
      </ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw error when is not boolean', () => {
      const params = {
        Attributes: {
          ContentBasedDeduplication: 'foo'
        },
        QueueName: 'foo-bar'
      };
      expect(() => createQueue(params)).toThrow(
        'Expected a value of type `boolean` for `Attributes.ContentBasedDeduplication` but received `"foo"`.'
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

      const expectedResponse = `
      <CreateQueueResponse>
      <CreateQueueResult>
      <QueueUrl>https://queue.amazonaws.com/123/foo-bar-with-tags</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
      <RequestId>7a62c49f-347e-4fc4-9331-6e8e7a96aa73</RequestId>
      </ResponseMetadata>
      </CreateQueueResponse>`;

      const result = createQueue(params);
      expect(result).toEqualXML(expectedResponse);
    });

    test('throw error when trying to create duplicate queue with different params', () => {
      const params = {
        QueueName: 'test-duplicate'
      };

      createQueue(params);

      const params1 = {
        Attributes: {
          DelaySeconds: 100
        },
        QueueName: 'test-duplicate'
      };

      const expectedResponse = `<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>QueueAlreadyExists</Code>
      <Message>A queue already exists with the same name and a different value for attribute DelaySeconds}</Message>
      <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;

      try {
        createQueue(params1);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('-- error when trying to create duplicate queue with different params', () => {
      const params = {
        Attributes: {
          DelaySeconds: 100
        },
        QueueName: 'test-duplicate'
      };

      createQueue(params);

      const params1 = {
        Attributes: {
          DelaySeconds: 100,
          VisibilityTimeout: 500
        },
        QueueName: 'test-duplicate'
      };

      const expectedResponse = `<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>QueueAlreadyExists</Code>
      <Message>A queue already exists with the same name and a different value for attribute VisibilityTimeout</Message>
      <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;

      try {
        createQueue(params1);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });
  });

  describe('listQueues', () => {
    test('list all available queues', () => {
      const listOfQueues = listQueues();

      const expectedResponse = `<ListQueuesResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ListQueuesResult><QueueUrl>https://queue.amazonaws.com/123/foo-bar</QueueUrl>,<QueueUrl>https://queue.amazonaws.com/123/dead-letter-queue</QueueUrl>,<QueueUrl>https://queue.amazonaws.com/123/dead-letter-queue1.fifo</QueueUrl>,<QueueUrl>https://queue.amazonaws.com/123/foo-with-dlq.fifo</QueueUrl>,<QueueUrl>https://queue.amazonaws.com/123/foo-bar12</QueueUrl>,<QueueUrl>https://queue.amazonaws.com/123/foo-bar-with-tags</QueueUrl>,<QueueUrl>https://queue.amazonaws.com/123/test-duplicate</QueueUrl></ListQueuesResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </ListQueuesResponse>`;

      expect(listOfQueues).toEqualXML(expectedResponse);
    });
  });
});
