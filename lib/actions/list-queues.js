'use strict';

const { listQueues } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

module.exports = () =>
  toXml('ListQueuesResponse', {
    ListQueuesResult: [{ QueueUrl: listQueues() }],
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    }
  });
