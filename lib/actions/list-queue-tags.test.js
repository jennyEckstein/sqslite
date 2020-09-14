'use strict';

const dedent = require('dedent');
const actionListQueueTags = require('./list-queue-tags');
const { listQueueTags } = require('../sqs');

jest.mock('../sqs');
describe('list-queue-tags', () => {
  test('list tags when empty', () => {
    const body = { QueueUrl: 'http://localhost:3000/queues/jenny-test' };
    expect(actionListQueueTags(body)).toEqual(dedent`
    <?xml version="1.0"?>
    <ListQueueTagsResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ListQueueTagsResult/>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </ListQueueTagsResponse>`);
  });

  test('list tags when there multiples', () => {
    listQueueTags.mockImplementationOnce(() => ({ foo1: 'bar1', foo2: 'bar2' }));

    const body = { QueueUrl: 'http://localhost:3000/queues/jenny-test' };
    expect(actionListQueueTags(body)).toEqual(dedent`
    <?xml version="1.0"?>
    <ListQueueTagsResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ListQueueTagsResult>
        <Tag>
          <Key>foo1</Key>
          <Value>bar1</Value>
        </Tag>
        <Tag>
          <Key>foo2</Key>
          <Value>bar2</Value>
        </Tag>
      </ListQueueTagsResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </ListQueueTagsResponse>`);
  });
});
