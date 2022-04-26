'use strict';

const dedent = require('dedent');

const { sendMessage } = require('../sqs');
const actionSendMessage = require('./send-message');
const { ErrorWithCode } = require('../utils/errors');
const samples = require('./samples/send-message.test.json');

jest.mock('../sqs');

describe('actions/send-message', () => {
  beforeEach(() => jest.resetAllMocks());

  test('return sent message', () => {
    sendMessage.mockImplementationOnce(() => ({
      MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
      MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a'
    }));
    expect(
      actionSendMessage({
        Action: 'SendMessage',
        MessageBody: 'foo',
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test',
        Version: '2012-11-05'
      })
    ).toEqual(samples.baseResponseXMLString);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenNthCalledWith(1, {
      DelaySeconds: undefined,
      MessageBody: 'foo',
      MessageGroupId: undefined,
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test'
    });
  });

  test('throw error when send message failed', () => {
    sendMessage.mockImplementationOnce(() => {
      throw new ErrorWithCode('foo', 'bar');
    });

    let error;
    try {
      actionSendMessage({
        Action: 'SendMessage',
        MessageBody: 'foo',
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test',
        Version: '2012-11-05'
      });
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
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenNthCalledWith(1, {
      DelaySeconds: undefined,
      MessageBody: 'foo',
      MessageGroupId: undefined,
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test'
    });
  });

  describe('MessageAttributes', () => {
    test('throw error when MessageAttributes has more than 10 attributes', () => {
      expect(() =>
        actionSendMessage({
          Action: 'SendMessage',
          'MessageAttribute.1.Name': 'City',
          'MessageAttribute.1.Value.DataType': 'String',
          'MessageAttribute.2.Name': 'Greeting',
          'MessageAttribute.2.Value.BinaryValue': 'SGVsbG8sIFdvcmxkIQ==',
          'MessageAttribute.2.Value.DataType': 'Binary',
          'MessageAttribute.3.Name': 'Population',
          'MessageAttribute.3.Value.DataType': 'Number',
          'MessageAttribute.3.Value.StringValue': '1250800',
          'MessageAttribute.4.Name': 'City1',
          'MessageAttribute.4.Value.DataType': 'String',
          'MessageAttribute.4.Value.StringValue': 'Any City',
          'MessageAttribute.5.Name': 'Greeting1',
          'MessageAttribute.5.Value.BinaryValue': 'SGVsbG8sIFdvcmxkIQ==',
          'MessageAttribute.5.Value.DataType': 'Binary',
          'MessageAttribute.6.Name': 'Population1',
          'MessageAttribute.6.Value.DataType': 'Number',
          'MessageAttribute.6.Value.StringValue': '1250800',
          'MessageAttribute.7.Name': 'City2',
          'MessageAttribute.7.Value.DataType': 'String',
          'MessageAttribute.7.Value.StringValue': 'Any City',
          'MessageAttribute.8.Name': 'Greeting2',
          'MessageAttribute.8.Value.BinaryValue': 'SGVsbG8sIFdvcmxkIQ==',
          'MessageAttribute.8.Value.DataType': 'Binary',
          'MessageAttribute.9.Name': 'Population2',
          'MessageAttribute.9.Value.DataType': 'Number',
          'MessageAttribute.9.Value.StringValue': '1250800',
          'MessageAttribute.10.Name': 'City3',
          'MessageAttribute.10.Value.DataType': 'String',
          'MessageAttribute.10.Value.StringValue': 'Any City',
          'MessageAttribute.11.Name': 'Greeting3',
          'MessageAttribute.11.Value.BinaryValue': 'SGVsbG8sIFdvcmxkIQ==',
          'MessageAttribute.11.Value.DataType': 'Binary',
          'MessageAttribute.12.Name': 'Population3',
          'MessageAttribute.12.Value.DataType': 'Number',
          'MessageAttribute.12.Value.StringValue': '1250800',
          MessageBody: 'foo',
          QueueUrl: 'https://localhost:3000/queues/jenny-test1',
          Version: '2012-11-05'
        })
      ).toThrow('Number of message attributes [12] exceeds the allowed maximum [10].');
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });
    test('successfully send message with custom MessageAttributes', () => {
      sendMessage.mockImplementationOnce(() => ({
        MD5OfMessageAttributes: 'c88bf72ef34813c10baf9082a5d7f84a',
        MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
        MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a'
      }));
      expect(
        actionSendMessage({
          Action: 'SendMessage',
          'MessageAttribute.1.Name': 'City',
          'MessageAttribute.1.Value.DataType': 'String',
          'MessageAttribute.2.Name': 'Greeting',
          'MessageAttribute.2.Value.BinaryValue': 'SGVsbG8sIFdvcmxkIQ==',
          'MessageAttribute.2.Value.DataType': 'Binary',
          'MessageAttribute.3.Name': 'Population',
          'MessageAttribute.3.Value.DataType': 'Number',
          'MessageAttribute.3.Value.StringValue': '1250800',
          'MessageAttribute.4.Name': 'City1',
          'MessageAttribute.4.Value.DataType': 'String',
          'MessageAttribute.4.Value.StringValue': 'Any City',
          'MessageAttribute.5.Name': 'Greeting1',
          'MessageAttribute.5.Value.BinaryValue': 'SGVsbG8sIFdvcmxkIQ==',
          'MessageAttribute.5.Value.DataType': 'Binary',
          'MessageAttribute.6.Name': 'Population1',
          'MessageAttribute.6.Value.DataType': 'Number',
          'MessageAttribute.6.Value.StringValue': '1250800',
          'MessageAttribute.7.Name': 'City2',
          'MessageAttribute.7.Value.DataType': 'String',
          'MessageAttribute.7.Value.StringValue': 'Any City',
          'MessageAttribute.8.Name': 'Greeting2',
          'MessageAttribute.8.Value.BinaryValue': 'SGVsbG8sIFdvcmxkIQ==',
          'MessageAttribute.8.Value.DataType': 'Binary',
          'MessageAttribute.9.Name': 'Population2',
          'MessageAttribute.9.Value.DataType': 'Number',
          'MessageAttribute.9.Value.StringValue': '1250800',
          'MessageAttribute.10.Name': 'City3',
          'MessageAttribute.10.Value.DataType': 'String',
          'MessageAttribute.10.Value.StringValue': 'Any City',
          MessageBody: 'foo',
          QueueUrl: 'https://localhost:3000/queues/jenny-test1',
          Version: '2012-11-05'
        })
      ).toEqual(samples.messageAttributesResponseXMLString);
      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(sendMessage).toHaveBeenNthCalledWith(1, {
        DelaySeconds: undefined,
        MessageAttributes: {
          City: {
            DataType: 'String'
          },
          City1: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          City2: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          City3: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'SGVsbG8sIFdvcmxkIQ==',
            DataType: 'Binary'
          },
          Greeting1: {
            BinaryValue: 'SGVsbG8sIFdvcmxkIQ==',
            DataType: 'Binary'
          },
          Greeting2: {
            BinaryValue: 'SGVsbG8sIFdvcmxkIQ==',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          },
          Population1: {
            DataType: 'Number',
            StringValue: '1250800'
          },
          Population2: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo',
        MessageGroupId: undefined,
        QueueUrl: 'https://localhost:3000/queues/jenny-test1'
      });
    });
  });

  describe('MessageSystemAttributes', () => {
    test('send message with string value', () => {
      sendMessage.mockImplementationOnce(() => ({
        MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
        MD5OfMessageSystemAttributes: '00000000000000000000000000000000',
        MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a',
        SequenceNumber: '18850180853819632128'
      }));
      expect(
        actionSendMessage({
          Action: 'SendMessage',
          MessageBody: 'foo',
          'MessageSystemAttribute.1.Name': 'AWSTraceHeader',
          'MessageSystemAttribute.1.Value.DataType': 'String',
          'MessageSystemAttribute.1.Value.StringValue': 'Foo=bar&baz=qux',
          QueueUrl: 'https://queue.amazonaws.com/144505630525/foo-bar',
          Version: '2012-11-05'
        })
      ).toEqual(samples.stringMessageResponseXMLString);
      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(sendMessage).toHaveBeenNthCalledWith(1, {
        DelaySeconds: undefined,
        MessageBody: 'foo',
        MessageGroupId: undefined,
        MessageSystemAttributes: {
          AWSTraceHeader: {
            DataType: 'String',
            StringValue: 'Foo=bar&baz=qux'
          }
        },
        QueueUrl: 'https://queue.amazonaws.com/144505630525/foo-bar'
      });
    });

    test('send message binary value', () => {
      sendMessage.mockImplementationOnce(() => ({
        MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
        MD5OfMessageSystemAttributes: '00000000000000000000000000000000',
        MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a',
        SequenceNumber: '18850180853819632128'
      }));
      expect(
        actionSendMessage({
          Action: 'SendMessage',
          MessageBody: 'foo',
          'MessageSystemAttribute.1.Name': 'AWSTraceHeader',
          'MessageSystemAttribute.1.Value.BinaryValue': 'Foo=bar&baz=qux',
          'MessageSystemAttribute.1.Value.DataType': 'String',
          QueueUrl: 'https://queue.amazonaws.com/144505630525/foo-bar',
          Version: '2012-11-05'
        })
      ).toEqual(samples.binaryMessageResponseXMLString);
      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(sendMessage).toHaveBeenNthCalledWith(1, {
        DelaySeconds: undefined,
        MessageBody: 'foo',
        MessageGroupId: undefined,
        MessageSystemAttributes: {
          AWSTraceHeader: {
            DataType: 'String',
            StringValue: 'Foo=bar&baz=qux'
          }
        },
        QueueUrl: 'https://queue.amazonaws.com/144505630525/foo-bar'
      });
    });

    test('throw error when Name is anything but AWSTraceHeader', () => {
      expect(() =>
        actionSendMessage({
          Action: 'SendMessage',
          MessageBody: 'foo',
          'MessageSystemAttribute.1.Name': 'FOO',
          'MessageSystemAttribute.1.Value.DataType': 'String',
          'MessageSystemAttribute.1.Value.StringValue': 'Foo=bar&baz=qux',
          QueueUrl: 'https://queue.amazonaws.com/144505630525/foo-bar',
          Version: '2012-11-05'
        })
      ).toThrow('Message system attribute name FOO is invalid.');
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });
  });

  describe('SequenceNumber', () => {
    test('return sent message', () => {
      sendMessage.mockImplementationOnce(() => ({
        MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
        MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a',
        SequenceNumber: '18850180853819632128'
      }));
      expect(
        actionSendMessage({
          Action: 'SendMessage',
          MessageBody: 'foo',
          MessageDeduplicationId: '2222',
          QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test',
          Version: '2012-11-05'
        })
      ).toEqual(samples.sequenceNumberResponseXMLString);
      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(sendMessage).toHaveBeenNthCalledWith(1, {
        DelaySeconds: undefined,
        MessageBody: 'foo',
        MessageGroupId: undefined,
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test'
      });
    });
  });
});
