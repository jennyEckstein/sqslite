'use strict';

const dedent = require('dedent');
const { receiveMessage } = require('../sqs');
const actionReceiveMessage = require('./receive-message');

jest.mock('../sqs');

describe('actions/receive-message', () => {
  test('throw error when receiveMessage throws error', () => {
    receiveMessage.mockImplementationOnce(() => {
      throw Object.assign(new Error('foo'), { code: 'bar' });
    });

    const expectedResponse = dedent`<?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
        <Type>Sender</Type>
        <Code>bar</Code>
        <Message>foo</Message>
        <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>`;

    let error;
    try {
      actionReceiveMessage({ QueueUrl: 'foo-bar' });
    } catch (err) {
      error = err;
    }
    expect(error.message).toEqual('foo');
    expect(error.xml).toEqual(expectedResponse);
  });

  test.skip('successfully receive message', () => {
    receiveMessage.mockImplementationOnce(() => {
      return [{ Body: 'foo', MD5OfBody: 'b2b2b', MessageId: 'bar', ReceiptHandle: 'abc' }];
    });

    const expectedResponse = dedent`
    <?xml version="1.0"?>
    <ReceiveMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ReceiveMessageResult>
        <Message>
          <MessageId>bar</MessageId>
          <ReceiptHandle>abc</ReceiptHandle>
          <MD5OfBody>b2b2b</MD5OfBody>
          <Body>foo</Body>
        </Message>
      </ReceiveMessageResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </ReceiveMessageResponse>
    `;

    const response = actionReceiveMessage({ QueueUrl: 'faz' });
    expect(response).toEqual(expectedResponse);
  });
});
