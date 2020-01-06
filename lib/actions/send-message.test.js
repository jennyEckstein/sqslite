'use strict';

const dedent = require('dedent');
const { sendMessage } = require('../sqs');
const actionSendMessage = require('./send-message');

jest.mock('../sqs');

describe('actions/send-message', () => {
  test('return sent message', () => {
    const body = {
      Action: 'SendMessage',
      MessageBody: 'foo',
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test',
      Version: '2012-11-05'
    };

    sendMessage.mockImplementationOnce(() => {
      return {
        MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
        MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a'
      };
    });

    const expectedResponse = dedent(`<?xml version="1.0"?>
  <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <ResponseMetadata>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ResponseMetadata>
    <SendMessageResult>
      <MD5OfMessageBody>acbd18db4cc2f85cedef654fccc4a4d8</MD5OfMessageBody>
      <MessageId>3be721ed-22bd-4871-a764-b42c47ac9f7a</MessageId>
    </SendMessageResult>
  </SendMessageResponse>`);

    const response = actionSendMessage(body);
    expect(response).toEqual(expectedResponse);
  });

  test('throw error when send message failed', () => {
    const body = {
      Action: 'SendMessage',
      MessageBody: 'foo',
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test',
      Version: '2012-11-05'
    };

    sendMessage.mockImplementationOnce(() => {
      throw Object.assign(new Error('foo'), { code: 'bar' });
    });

    const expectedResponse = dedent(`<?xml version="1.0"?>
  <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <Error>
      <Code>bar</Code>
      <Detail/>
      <Message>foo</Message>
      <Type>Sender</Type>
    </Error>
    <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
  </ErrorResponse>`);

    let error;
    try {
      actionSendMessage(body);
    } catch (err) {
      error = err;
    }
    expect(error.message).toEqual('foo');
    expect(error.xml).toEqual(expectedResponse);
  });

  describe('MessageAttributes', () => {
    test('throw error when MessageAttributes has more than 10 attributes', () => {
      const body = {
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
      };
      expect(() => actionSendMessage(body)).toThrow(
        'Number of message attributes [12] exceeds the allowed maximum [10].'
      );
    });
    test('successfully send message with custom MessageAttributes', () => {
      const body = {
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
      };

      sendMessage.mockImplementationOnce(() => {
        return {
          MD5OfMessageAttributes: 'c88bf72ef34813c10baf9082a5d7f84a',
          MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
          MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a'
        };
      });

      const expectedResponse = dedent(`<?xml version="1.0"?>
  <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <ResponseMetadata>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ResponseMetadata>
    <SendMessageResult>
      <MD5OfMessageAttributes>c88bf72ef34813c10baf9082a5d7f84a</MD5OfMessageAttributes>
      <MD5OfMessageBody>acbd18db4cc2f85cedef654fccc4a4d8</MD5OfMessageBody>
      <MessageId>3be721ed-22bd-4871-a764-b42c47ac9f7a</MessageId>
    </SendMessageResult>
  </SendMessageResponse>`);

      const response = actionSendMessage(body);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('MessageSystemAttributes', () => {
    test('send message with string value', () => {
      const body = {
        Action: 'SendMessage',
        MessageBody: 'foo',
        'MessageSystemAttribute.1.Name': 'AWSTraceHeader',
        'MessageSystemAttribute.1.Value.DataType': 'String',
        'MessageSystemAttribute.1.Value.StringValue': 'Foo=bar&baz=qux',
        QueueUrl: 'https://queue.amazonaws.com/144505630525/foo-bar',
        Version: '2012-11-05'
      };

      sendMessage.mockImplementationOnce(() => {
        return {
          MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
          MD5OfMessageSystemAttributes: '00000000000000000000000000000000',
          MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a',
          SequenceNumber: '18850180853819632128'
        };
      });
      const expectedResponse = dedent`<?xml version="1.0"?>
    <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
      <SendMessageResult>
        <MD5OfMessageBody>acbd18db4cc2f85cedef654fccc4a4d8</MD5OfMessageBody>
        <MD5OfMessageSystemAttributes>00000000000000000000000000000000</MD5OfMessageSystemAttributes>
        <MessageId>3be721ed-22bd-4871-a764-b42c47ac9f7a</MessageId>
        <SequenceNumber>18850180853819632128</SequenceNumber>
      </SendMessageResult>
    </SendMessageResponse>`;

      const response = actionSendMessage(body);
      expect(response).toEqual(expectedResponse);
    });

    test('send message binary value', () => {
      const body = {
        Action: 'SendMessage',
        MessageBody: 'foo',
        'MessageSystemAttribute.1.Name': 'AWSTraceHeader',
        'MessageSystemAttribute.1.Value.BinaryValue': 'Foo=bar&baz=qux',
        'MessageSystemAttribute.1.Value.DataType': 'String',
        QueueUrl: 'https://queue.amazonaws.com/144505630525/foo-bar',
        Version: '2012-11-05'
      };

      sendMessage.mockImplementationOnce(() => {
        return {
          MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
          MD5OfMessageSystemAttributes: '00000000000000000000000000000000',
          MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a',
          SequenceNumber: '18850180853819632128'
        };
      });
      const expectedResponse = dedent`<?xml version="1.0"?>
    <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
      <SendMessageResult>
        <MD5OfMessageBody>acbd18db4cc2f85cedef654fccc4a4d8</MD5OfMessageBody>
        <MD5OfMessageSystemAttributes>00000000000000000000000000000000</MD5OfMessageSystemAttributes>
        <MessageId>3be721ed-22bd-4871-a764-b42c47ac9f7a</MessageId>
        <SequenceNumber>18850180853819632128</SequenceNumber>
      </SendMessageResult>
    </SendMessageResponse>`;

      const response = actionSendMessage(body);
      expect(response).toEqual(expectedResponse);
    });

    test('throw error when Name is anything but AWSTraceHeader', () => {
      const body = {
        Action: 'SendMessage',
        MessageBody: 'foo',
        'MessageSystemAttribute.1.Name': 'FOO',
        'MessageSystemAttribute.1.Value.DataType': 'String',
        'MessageSystemAttribute.1.Value.StringValue': 'Foo=bar&baz=qux',
        QueueUrl: 'https://queue.amazonaws.com/144505630525/foo-bar',
        Version: '2012-11-05'
      };

      expect(() => actionSendMessage(body)).toThrow(
        'Message system attribute name FOO is invalid.'
      );
    });
  });

  describe('SequenceNumber', () => {
    test('return sent message', () => {
      const body = {
        Action: 'SendMessage',
        MessageBody: 'foo',
        MessageDeduplicationId: '2222',
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test',
        Version: '2012-11-05'
      };

      sendMessage.mockImplementationOnce(() => {
        return {
          MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
          MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a',
          SequenceNumber: '18850180853819632128'
        };
      });

      const expectedResponse = dedent(`<?xml version="1.0"?>
    <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
      <SendMessageResult>
        <MD5OfMessageBody>acbd18db4cc2f85cedef654fccc4a4d8</MD5OfMessageBody>
        <MessageId>3be721ed-22bd-4871-a764-b42c47ac9f7a</MessageId>
        <SequenceNumber>18850180853819632128</SequenceNumber>
      </SendMessageResult>
    </SendMessageResponse>`);

      const response = actionSendMessage(body);
      expect(response).toEqual(expectedResponse);
    });
  });
});
