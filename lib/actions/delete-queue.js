'use strict';

const { deleteQueue } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

/**
 * Deletes a queue.
 *
 * @param {Object} body - Request body.
 * @param {string} body.QueueUrl - The url of the queue.
 * @returns {string} DeleteQueueResponse in XML format.
 */
module.exports = ({ QueueUrl }) => {
  const params = { QueueUrl };

  deleteQueue(params);

  return toXml('DeleteQueueResponse', {
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    }
  });
};
