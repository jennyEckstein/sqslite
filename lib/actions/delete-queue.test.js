'use strict';

const dedent = require('dedent');
const { deleteQueue } = require('../sqs');
const actionDeleteQueue = require('./delete-queue');

jest.mock('../sqs');

describe('actions/delete-queue', () => {
  beforeEach(() => jest.resetAllMocks());

  test('successfully delete message', () => {
    deleteQueue.mockImplementationOnce(() => undefined);

    expect(actionDeleteQueue({ QueueUrl: 'foo' })).toEqual(dedent`
    <?xml version="1.0"?>
    <DeleteQueueResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </DeleteQueueResponse>`);

    expect(deleteQueue).toHaveBeenCalledTimes(1);
    expect(deleteQueue).toHaveBeenNthCalledWith(1, { QueueUrl: 'foo' });
  });
});
