'use strict';

const dedent = require('dedent');
const actionUntagQueue = require('./untag-queue');

jest.mock('../sqs');

describe('untag-queue', () => {
  test('untag queue', () => {
    const body = {
      Action: 'UntagQueue',
      QueueUrl: 'http://localhost:3000/queues/jenny-test',
      'TagKey.1': 'foo1',
      'TagKey.2': 'foo2',
      Version: '2012-11-05'
    };

    expect(actionUntagQueue(body)).toEqual(dedent`<?xml version="1.0"?>
    <UntagQueueResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </UntagQueueResponse>`);
  });
});
