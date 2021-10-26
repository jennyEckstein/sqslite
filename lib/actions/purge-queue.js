'use strict';

const { purgeQueue } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Delete all messages in the queue.
 *
 * @param {Object} body - Request body.
 * @param {string} body.QueueUrl - The url of the queue.
 * @returns {string} ListQueueTagsResponse in XML format.
 * @throws ErrorResponse in XML format, based on `purgeQueue` errors.
 */
module.exports = ({ QueueUrl }) => {
  try {
    purgeQueue(QueueUrl);
    return toXml('PurgeQueueResponse', {
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
