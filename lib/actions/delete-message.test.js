'use strict';

const dedent = require('dedent');
const { deleteMessage } = require('../sqs');
const actionDeleteMessage = require('./delete-message');

jest.mock('../sqs');

describe('actions/delete-message', () => {
  beforeEach(() => jest.resetAllMocks());

  test('successfully delete message', () => {
    deleteMessage.mockImplementationOnce(() => undefined);

    expect(actionDeleteMessage({ QueueUrl: 'foo', ReceiptHandle: 'bar' }))
      .toEqual(dedent`<?xml version="1.0"?>
    <DeleteMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </DeleteMessageResponse>`);

    expect(deleteMessage).toHaveBeenCalledTimes(1);
    expect(deleteMessage).toHaveBeenNthCalledWith(1, {
      QueueUrl: 'foo',
      ReceiptHandle: 'bar'
    });
  });
});
