'use strict';

const dedent = require('dedent');

const { receiveMessage } = require('../sqs');
const actionReceiveMessage = require('./receive-message');
const { ErrorWithCode } = require('../utils/errors');

jest.mock('../sqs');

describe('actions/receive-message', () => {
  beforeEach(() => jest.resetAllMocks());

  test('throw error when receiveMessage throws error', () => {
    receiveMessage.mockImplementationOnce(() => {
      throw new ErrorWithCode('foo', 'bar');
    });

    let error;
    try {
      actionReceiveMessage({ QueueUrl: 'foo-bar' });
    } catch (err) {
      error = err;
    }
    expect(error.message).toEqual('foo');
    expect(error.xml).toEqual(dedent`
      <?xml version="1.0"?>
      <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
          <Code>bar</Code>
          <Detail/>
          <Message>foo</Message>
          <Type>Sender</Type>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ErrorResponse>
    `);
    expect(receiveMessage).toHaveBeenCalledTimes(1);
    expect(receiveMessage).toHaveBeenNthCalledWith(1, {
      AttributeNames: [],
      MaxNumberOfMessages: undefined,
      MessageAttributeNames: [],
      QueueUrl: 'foo-bar',
      VisibilityTimeout: undefined,
      WaitTimeSeconds: undefined
    });
  });

  test('successfully receive message', () => {
    receiveMessage.mockImplementationOnce(() => [
      { Body: 'foo', MD5OfBody: 'b2b2b', MessageId: 'bar', ReceiptHandle: 'abc' }
    ]);
    expect(actionReceiveMessage({ QueueUrl: 'faz' })).toEqual(dedent`
      <?xml version="1.0"?>
      <ReceiveMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <ReceiveMessageResult>
          <Message>
            <Body>foo</Body>
            <MD5OfBody>b2b2b</MD5OfBody>
            <MessageId>bar</MessageId>
            <ReceiptHandle>abc</ReceiptHandle>
          </Message>
        </ReceiveMessageResult>
        <ResponseMetadata>
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ResponseMetadata>
      </ReceiveMessageResponse>
    `);
    expect(receiveMessage).toHaveBeenCalledTimes(1);
    expect(receiveMessage).toHaveBeenNthCalledWith(1, {
      AttributeNames: [],
      MaxNumberOfMessages: undefined,
      MessageAttributeNames: [],
      QueueUrl: 'faz',
      VisibilityTimeout: undefined,
      WaitTimeSeconds: undefined
    });
  });

  test('successfully receive message with message attributes', () => {
    receiveMessage.mockImplementationOnce(() => [
      {
        Body: 'foo',
        MD5OfBody: 'b2b2b',
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
        MessageId: '123',
        ReceiptHandle: 'abc'
      }
    ]);
    expect(
      actionReceiveMessage({
        Action: 'ReceiveMessage',
        MaxNumberOfMessages: '1',
        'MessageAttributeName.1': 'Population',
        'MessageAttributeName.2': 'Foo',
        'MessageAttributeName.3': 'Greeting',
        QueueUrl: 'http://localhost:3000/queues/core-test',
        Version: '2012-11-05'
      })
    ).toEqual(dedent`
      <?xml version="1.0"?>
      <ReceiveMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <ReceiveMessageResult>
          <Message>
            <Body>foo</Body>
            <MD5OfBody>b2b2b</MD5OfBody>
            <MessageAttribute>
              <Name>City</Name>
              <Value>
                <DataType>String</DataType>
                <StringValue>Any City</StringValue>
              </Value>
            </MessageAttribute>
            <MessageAttribute>
              <Name>Greeting</Name>
              <Value>
                <DataType>Binary</DataType>
                <BinaryValue>Hello, World!</BinaryValue>
              </Value>
            </MessageAttribute>
            <MessageId>123</MessageId>
            <ReceiptHandle>abc</ReceiptHandle>
          </Message>
        </ReceiveMessageResult>
        <ResponseMetadata>
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ResponseMetadata>
      </ReceiveMessageResponse>
    `);
    expect(receiveMessage).toHaveBeenCalledTimes(1);
    expect(receiveMessage).toHaveBeenNthCalledWith(1, {
      AttributeNames: [],
      MaxNumberOfMessages: '1',
      MessageAttributeNames: ['Population', 'Foo', 'Greeting'],
      QueueUrl: 'http://localhost:3000/queues/core-test',
      VisibilityTimeout: undefined,
      WaitTimeSeconds: undefined
    });
  });

  test('successfully receive message with attributes', () => {
    receiveMessage.mockImplementationOnce(() => [
      {
        Attributes: {
          ApproximateReceiveCount: 2,
          SenderId: '12345'
        },
        Body: 'foo',
        MD5OfBody: 'b2b2b',
        MessageId: '123',
        ReceiptHandle: 'abc'
      }
    ]);
    expect(
      actionReceiveMessage({
        Action: 'ReceiveMessage',
        'AttributeName.1': 'SenderId',
        'AttributeName.2': 'ApproximateReceiveCount',
        MaxNumberOfMessages: '1',
        QueueUrl: 'http://localhost:3000/queues/core-test',
        Version: '2012-11-05'
      })
    ).toEqual(dedent`
      <?xml version="1.0"?>
      <ReceiveMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <ReceiveMessageResult>
          <Message>
            <Attribute>
              <Name>ApproximateReceiveCount</Name>
              <Value>2</Value>
            </Attribute>
            <Attribute>
              <Name>SenderId</Name>
              <Value>12345</Value>
            </Attribute>
            <Body>foo</Body>
            <MD5OfBody>b2b2b</MD5OfBody>
            <MessageId>123</MessageId>
            <ReceiptHandle>abc</ReceiptHandle>
          </Message>
        </ReceiveMessageResult>
        <ResponseMetadata>
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ResponseMetadata>
      </ReceiveMessageResponse>
    `);
    expect(receiveMessage).toHaveBeenCalledTimes(1);
    expect(receiveMessage).toHaveBeenNthCalledWith(1, {
      AttributeNames: ['SenderId', 'ApproximateReceiveCount'],
      MaxNumberOfMessages: '1',
      MessageAttributeNames: [],
      QueueUrl: 'http://localhost:3000/queues/core-test',
      VisibilityTimeout: undefined,
      WaitTimeSeconds: undefined
    });
  });
});
