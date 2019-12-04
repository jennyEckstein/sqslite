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

    const expectedResponse = dedent(`
    <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <SendMessageResult>
      <MD5OfMessageBody>acbd18db4cc2f85cedef654fccc4a4d8</MD5OfMessageBody>
      <MessageId>3be721ed-22bd-4871-a764-b42c47ac9f7a</MessageId>
    </SendMessageResult>
    <ResponseMetadata>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ResponseMetadata>
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

    const expectedResponse = dedent(`
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <Error>
      <Type>Sender</Type>
      <Code>bar</Code>
      <Message>foo</Message>
      <Detail/>
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
});
