'use strict';

const { deleteMessage } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

/**
 * Deletes a message from the queue.
 *
 * @param {Object} body - Request body.
 * @param {string} body.QueueUrl - The url of the queue.
 * @param {string} body.ReceiptHandle - The receipt handle identifier of the message to be deleted.
 * @returns {string} DeleteMessageResponse in XML format.
 */
module.exports = ({ QueueUrl, ReceiptHandle }) => {
  const params = { QueueUrl, ReceiptHandle };

  deleteMessage(params);
  return toXml('DeleteMessageResponse', {
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    }
  });
};
