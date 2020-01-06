'use strict';

jest.mock('../sqs');
require('jest-xml-matcher');

const dedent = require('dedent');
const { listQueues } = require('../sqs');

const actionListQueues = require('./list-queues');

describe('list-queues', () => {
  test('return value from list queues', () => {
    listQueues.mockReturnValue([
      'https://queue.amazonaws.com/queues/core-test5',
      'https://queue.amazonaws.com/queues/core-test6'
    ]);

    const expectedResponse = dedent(`<?xml version="1.0"?>
    <ListQueuesResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ListQueuesResult>
        <QueueUrl>https://queue.amazonaws.com/queues/core-test5</QueueUrl>
        <QueueUrl>https://queue.amazonaws.com/queues/core-test6</QueueUrl>
      </ListQueuesResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </ListQueuesResponse>`);

    const result = actionListQueues();

    expect(result).toEqualXML(expectedResponse);
  });
});
