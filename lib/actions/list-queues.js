'use strict';

const dedent = require('dedent');
const { listQueues } = require('../sqs');

module.exports = () => {
  const list = listQueues();

  return dedent(`<?xml version="1.0"?>
    <ListQueuesResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ListQueuesResult>${list.map(i => `<QueueUrl>${i}</QueueUrl>`)}</ListQueuesResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </ListQueuesResponse>
  `);
};
