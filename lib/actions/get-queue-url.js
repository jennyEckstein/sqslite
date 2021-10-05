'use strict';

const { getQueueUrl } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Action Handler for retrieving the url of the queue.
 *
 * @param {Object} body - Request body.
 * @param {string} body.QueueName - The name of the queue.
 * @param {string} host - The host of the queue.
 * @returns {string} XMLGetQueueUrlResponse.
 * @throws XMLErrors, based on getQueueUrl's errors.
 */
module.exports = ({ QueueName }, host) => {
  try {
    return toXml('GetQueueUrlResponse', {
      GetQueueUrlResult: {
        QueueUrl: getQueueUrl(QueueName, host)
      },
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
