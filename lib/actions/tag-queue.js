'use strict';

const { tagQueue } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

/**
 * Action Handler for adding tags to the queue.
 *
 * @param {{
 *  QueueUrl: string,
 *  "Tag.i.Key": string|undefined,
 *  "Tag.i.Value": string|undefined
 * }} body - Request body.
 * @returns {string} XMLTagQueueResponse.
 *
 * @example Request body
 *
 * {
 *  QueueUrl: "queueUrl",
 *  "Tag.1.Key": "Priority",
 *  "Tag.1.Value": "Medium",
 *  "Tag.2.Key": "Locale",
 *  "Tag.2.Value": "en-US"
 * }
 */
module.exports = (body) => {
  const { QueueUrl } = body;

  const tagKeys = Object.keys(body).filter((key) => key.startsWith('Tag'));
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
