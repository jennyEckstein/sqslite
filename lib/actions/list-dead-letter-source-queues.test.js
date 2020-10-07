'use strict';

const dedent = require('dedent');
const actionListDeadLetterSourceQueues = require('./list-dead-letter-source-queues');
const { ErrorWithCode } = require('../utils/errors');
const { listDeadLetterSourceQueues } = require('../sqs');

jest.mock('../sqs');

describe('lib/actions/list-dead-letter-source-queues', () => {
  test('list dead letter queue sources', () => {
    listDeadLetterSourceQueues.mockImplementationOnce(() => {
      return [
        'http://localhost:3001/queues/core-test-1',
        'http://localhost:3001/queues/core-test-2'
      ];
    });
    expect(
      actionListDeadLetterSourceQueues(
        { QueueUrl: 'http://localhost:3001/queues/core-test-dlq' },
        'http://localhost:3001'
      )
    ).toEqual(dedent`<?xml version="1.0"?>
    <ListDeadLetterSourceQueuesResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ListDeadLetterSourceQueuesResult>
        <QueueUrl>http://localhost:3001/queues/core-test-1</QueueUrl>
        <QueueUrl>http://localhost:3001/queues/core-test-2</QueueUrl>
      </ListDeadLetterSourceQueuesResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </ListDeadLetterSourceQueuesResponse>`);
  });

  test('throw error when purgeQueue returns error', () => {
    listDeadLetterSourceQueues.mockImplementationOnce(() => {
      throw new ErrorWithCode('foo', 'bar');
    });
    let err1;
    try {
      actionListDeadLetterSourceQueues(
        { QueueUrl: 'http://localhost:3001/queues/core-test-dlq' },
        'http://localhost:3001'
      );
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
