'use strict';

const { changeMessageVisibility } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Changes the queue's message visibility timeout.
 *
 * @param {Object} body - Request body.
 * @param {string} body.QueueUrl - The url for the queue that contains the message.
 * @param {string} body.ReceiptHandle - The receipt handle identifier.
 * @param {number} body.VisibilityTimeout - The new visibility time out value.
 * @returns {string} ChangeMessageVisibilityResponse in XML format.
 * @throws ErrorResponse in XML format, based on `changeMessageVisibility` errors.
 */
module.exports = ({ QueueUrl, ReceiptHandle, VisibilityTimeout }) => {
  try {
    changeMessageVisibility({ QueueUrl, ReceiptHandle, VisibilityTimeout });
    return toXml('ChangeMessageVisibilityResponse', {
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
