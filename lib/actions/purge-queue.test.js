'use strict';

const dedent = require('dedent');
const actionPurgeQueue = require('./purge-queue');
const { ErrorWithCode } = require('../utils/errors');
const { purgeQueue } = require('../sqs');

jest.mock('../sqs');

describe('lib/actions/purge-queue', () => {
  test('successfully purge queue', () => {
    expect(actionPurgeQueue({ QueueUrl: 'http://localhost:3001/queues/core-test' })).toEqual(
      dedent`<?xml version="1.0"?>
      <PurgeQueueResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <ResponseMetadata>
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ResponseMetadata>
      </PurgeQueueResponse>`
    );
  });

  test('throw error when purgeQueue returns error', () => {
    purgeQueue.mockImplementationOnce(() => {
      throw new ErrorWithCode('foo', 'bar');
    });
    let err1;
    try {
      actionPurgeQueue({ QueueUrl: 'http://localhost:3001/queues/core-test' });
    } catch (err) {
      err1 = err;
    }
    expect(err1.message).toEqual('foo');
    expect(err1.xml).toEqual(dedent`
    <?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
        <Code>bar</Code>
        <Detail/>
        <Message>foo</Message>
        <Type>Sender</Type>
      </Error>
    </ErrorResponse>`);
  });
});
