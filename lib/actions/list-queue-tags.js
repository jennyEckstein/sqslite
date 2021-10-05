'use strict';

const { listQueueTags } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

/**
 * Action Handler for retrieving tags for the queue.
 *
 * @param {Object} body - Request body.
 * @param {string} body.QueueUrl - The url of the queue.
 * @returns {string} XMLListQueueTagsResponse.
 */
module.exports = ({ QueueUrl }) => {
  const tags = listQueueTags(QueueUrl);

  return toXml('ListQueueTagsResponse', {
    ListQueueTagsResult: {
      Tag: Object.keys(tags || []).map((key) => ({ Key: key, Value: tags[key] }))
    },
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    }
  });
};
