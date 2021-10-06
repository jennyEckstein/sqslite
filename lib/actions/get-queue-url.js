'use strict';

const { getQueueUrl } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Rtrieves the url of the queue.
 *
 * @param {Object} body - Request body.
 * @param {string} body.QueueName - The name of the queue.
 * @param {string} host - The host of the queue.
 * @returns {string} GetQueueUrlResponse in XML format.
 * @throws ErrorReponse in XML format, based on `getQueueUrl` errors.
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
