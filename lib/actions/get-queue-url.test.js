'use strict';

const dedent = require('dedent');
const actionGetQueueUrl = require('./get-queue-url');

jest.mock('../sqs');

describe('get-queue-url', () => {
  test('successfully get queue url', () => {
    const body = { QueueName: 'foo-bar' };
    expect(actionGetQueueUrl(body, 'http://localhost:3001')).toEqual(dedent`
    <?xml version="1.0"?>
    <GetQueueUrlResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <GetQueueUrlResult/>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </GetQueueUrlResponse>`);
  });
});
