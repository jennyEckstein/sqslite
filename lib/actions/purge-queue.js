'use strict';

const { purgeQueue } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Action Handler for deleting all messages in the queue.
 *
 * @param {Object} body - Request body.
 * @param {string} body.QueueUrl - The url of the queue.
 * @returns {string} XMLListQueueTagsResponse.
 * @throws XMLErrors, based on purgeQueue's errors.
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
