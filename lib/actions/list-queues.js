'use strict';

const { listQueues } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

/**
 * Retrieves the total list of queues.
 *
 * @returns {string} ListQueuesResponse in XML format.
 */
module.exports = () =>
  toXml('ListQueuesResponse', {
    ListQueuesResult: [{ QueueUrl: listQueues() }],
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    }
  });
