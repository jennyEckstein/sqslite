'use strict';

const { listDeadLetterSourceQueues } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Action Handler for retrieving list of queues with RedrivePolicy configured as dead-letter queues.
 *
 * @param {Object} body - Request body.
 * @param {string} body.QueueUrl - The url of the queue.
 * @param {string} host - The host of the queue.
 * @returns {string} XMLListDeadLetterSourceQueuesResponse.
 * @throws XMLErrors, based on listDeadLetterSourceQueues's errors.
 */
module.exports = ({ QueueUrl }, host) => {
  try {
    return toXml('ListDeadLetterSourceQueuesResponse', {
      ListDeadLetterSourceQueuesResult: {
        QueueUrl: listDeadLetterSourceQueues(QueueUrl, host)
      },
      ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
