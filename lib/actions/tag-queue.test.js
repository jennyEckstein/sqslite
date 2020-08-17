'use strict';

const dedent = require('dedent');
const actionTagQueue = require('./tag-queue');

jest.mock('../sqs');
describe('tag-queue', () => {
  test('add tag', () => {
    const body = {
      Action: 'TagQueue',
      QueueUrl: 'http://localhost:3000/queues/jenny-test',
      'Tag.1.Key': 'foo',
      'Tag.1.Value': 'bar',
      Version: '2012-11-05'
    };

    expect(actionTagQueue(body)).toEqual(dedent`<?xml version="1.0"?>
    <TagQueueResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </TagQueueResponse>`);
  });
});
