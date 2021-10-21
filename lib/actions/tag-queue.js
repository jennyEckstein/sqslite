'use strict';

const { tagQueue } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

/**
 * Add tags to the queue.
 *
 * @param {Object.<string, string>} body - Request body.
 * @returns {string} TagQueueResponse in XML format.
 */
module.exports = (body) => {
  const { QueueUrl } = body;

  const tagKeys = Object.keys(body).filter((key) => key.startsWith('Tag'));

  /** @type {Object.<string, string>} */
  const Tags = {};
  for (let i = 1; i <= tagKeys.length / 2; i += 1) {
    Tags[body[`Tag.${i}.Key`]] = body[`Tag.${i}.Value`];
  }

  tagQueue(QueueUrl, Tags);
  return toXml('TagQueueResponse', {
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    }
  });
};
