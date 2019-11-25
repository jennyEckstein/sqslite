'use strict';

require('jest-xml-matcher');

const { createQueue, listQueues } = require('./sqs');

// TODO: refactor tests to allow each test run individually. At the moment created queues do not get cleared
describe('sqs', () => {
  describe('createQueue', () => {
    test('throw an error when queue name is too long', () => {
      expect.assertions(1);
      const params = {
        QueueName:
          '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
      };

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidParameterValue</Code>
      <Message>Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length</Message>
      <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
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
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
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
      const expectedResponse = `<?xml version=\"1.0\"?>
      <ErrorResponse xmlns=\"http://queue.amazonaws.com/doc/2012-11-05/\">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidParameterValue</Code>
      <Message>The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.</Message>
      <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw an error when queue name has invalid characters', () => {
      expect.assertions(1);
      const params = {
        QueueName: 'abc!@#'
      };

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidParameterValue</Code>
      <Message>Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length</Message>
      <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw error when DelaySeconds is invalid value', () => {
      expect.assertions(1);
      const params = {
        Attributes: {
          DelaySeconds: '1000'
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
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
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
      </Error><RequestId>00000000-0000-0000-0000-000000000000</RequestId>
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
          MessageRetentionPeriod: 1209601
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeValue</Code>
          <Message>Invalid value for the parameter MessageRetentionPeriod.</Message>
          <Detail/>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
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
      <Code>InvalidAttributeValue</Code>
      <Message>Invalid value for the parameter ReceiveMessageWaitTimeSeconds.</Message>
      <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;

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
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw an error when RedrivcePolicy missing deadLetterQueueArn', () => {
      expect.assertions(1);
      const params = {
        Attributes: {
          RedrivePolicy: '{}'
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidParameterValue</Code>
      <Message>Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.</Message>
      <Detail/></Error><RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw an error when RedrivePolicy missing maxReceiveCount', () => {
      expect.assertions(1);
      const params = {
        Attributes: {
          RedrivePolicy: '{ "deadLetterQueueArn": "arn" }'
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidParameterValue</Code>
      <Message>Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.</Message>
      <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw an error when deadLetterTargetArn does not exist', () => {
      const params = {
        Attributes: {
          RedrivePolicy: { deadLetterTargetArn: 'foo', maxReceiveCount: 10 }
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidParameterValue</Code>
      <Message>Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:144505630525:foo-bar-foo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.</Message>
      <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ErrorResponse>`;
      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throws an error when deadLetterQueue exists but does not much fifo/not fifo of the queue', () => {
      expect.assertions(1);
      const deadLetterQueueParams = {
        QueueName: 'dead-letter-queue'
      };
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

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidParameterValue</Code>
      <Message>Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:144505630525:foo-bar.fifo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead-letter queue must be same type of queue as the source..</Message>
      <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
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

      const expectedResponse = `<CreateQueueResponse>
      <CreateQueueResult>
      <QueueUrl>https://queue.amazonaws.com/123/foo-with-dlq.fifo</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
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
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
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
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
    });

    test('throw error when attempting to set ContentBasedDeduplication, with a non FIFO queue', () => {
      const params = {
        Attributes: {
          ContentBasedDeduplication: true
        },
        QueueName: 'foo-bar'
      };

      const expectedResponse = `<?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
      <Type>Sender</Type>
      <Code>InvalidAttributeName</Code>
      <Message>Unknown Attribute ContentBasedDeduplication.</Message>
      <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ErrorResponse>`;

      try {
        createQueue(params);
      } catch (err) {
        expect(err.message).toEqualXML(expectedResponse);
      }
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
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
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
