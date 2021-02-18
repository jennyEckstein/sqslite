'use strict';

const dedent = require('dedent');

const actionGetQueueUrl = require('./get-queue-url');
const { ErrorWithCode } = require('../utils/errors');
const { getQueueUrl } = require('../sqs');

jest.mock('../sqs');

describe('get-queue-url', () => {
  test('successfully get queue url', () => {
    expect(actionGetQueueUrl({ QueueName: 'foo-bar' }, 'http://localhost:3001')).toEqual(dedent`
    <?xml version="1.0"?>
    <GetQueueUrlResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <GetQueueUrlResult/>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </GetQueueUrlResponse>`);
  });

  test('throw error when getQueueUrl returns error', () => {
    getQueueUrl.mockImplementationOnce(() => {
      throw new ErrorWithCode('foo', 'bar');
    });
    let err1;
    try {
      actionGetQueueUrl({ QueueName: 'foo-bar' }, 'http://localhost:3001');
    } catch (err) {
      err1 = err;
    }
    expect(err1.message).toEqual('foo');
    expect(err1.xml).toEqual(dedent`<?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
        <Code>bar</Code>
        <Detail/>
        <Message>foo</Message>
        <Type>Sender</Type>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>`);
  });
});
