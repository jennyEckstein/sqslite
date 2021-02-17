'use strict';

const dedent = require('dedent');

const { deleteMessageBatch } = require('../sqs');
const { ErrorWithCode } = require('../utils/errors');
const actionDeleteMessageBatch = require('./delete-message-batch');

jest.mock('../sqs');

describe('actions/delete-message-batch', () => {
  beforeEach(() => jest.resetAllMocks());

  test('throw error when deleteMessageBatch fails', () => {
    deleteMessageBatch.mockImplementationOnce(() => {
      throw new ErrorWithCode('foo', 'bar');
    });
    let err1;
    try {
      actionDeleteMessageBatch({
        'DeleteMessageBatchRequestEntry.1.Id': '1001',
        'DeleteMessageBatchRequestEntry.1.ReceiptHandle': '1000001',
        'DeleteMessageBatchRequestEntry.2.Id': '1002',
        'DeleteMessageBatchRequestEntry.2.ReceiptHandle': '1000002',
        'DeleteMessageBatchRequestEntry.3.Id': '1003',
        'DeleteMessageBatchRequestEntry.3.ReceiptHandle': '1000003',
        QueueUrl: 'http://localhost:3000/queues/foo-bar'
      });
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
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>
    `);
  });
  test('successfully delete messages', () => {
    deleteMessageBatch.mockImplementationOnce(() => ['1001', '1002', '1003']);
    expect(
      actionDeleteMessageBatch({
        'DeleteMessageBatchRequestEntry.1.Id': '1001',
        'DeleteMessageBatchRequestEntry.1.ReceiptHandle': '1000001',
        'DeleteMessageBatchRequestEntry.2.Id': '1002',
        'DeleteMessageBatchRequestEntry.2.ReceiptHandle': '1000002',
        'DeleteMessageBatchRequestEntry.3.Id': '1003',
        'DeleteMessageBatchRequestEntry.3.ReceiptHandle': '1000003',
        QueueUrl: 'http://localhost:3000/queues/foo-bar'
      })
    ).toEqual(dedent`<?xml version="1.0"?>
    <DeleteMessageBatchResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <DeleteMessageBatchResult>
        <DeleteMessageBatchResultEntry>
          <Id>1001</Id>
        </DeleteMessageBatchResultEntry>
        <DeleteMessageBatchResultEntry>
          <Id>1002</Id>
        </DeleteMessageBatchResultEntry>
        <DeleteMessageBatchResultEntry>
          <Id>1003</Id>
        </DeleteMessageBatchResultEntry>
      </DeleteMessageBatchResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </DeleteMessageBatchResponse>`);
  });
});
