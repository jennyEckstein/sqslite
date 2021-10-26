'use strict';

const { listDeadLetterSourceQueues } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Retrieves list of queues with configured RedrivePolicy set to a dead-letter queues.
 *
 * @param {Object} body - Request body.
 * @param {string} body.QueueUrl - The url of the queue.
 * @param {string} host - The host of the queue.
 * @returns {string} ListDeadLetterSourceQueuesResponse in XML format.
 * @throws ErrorReponse in XML format, based on `listDeadLetterSourceQueues` errors.
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
