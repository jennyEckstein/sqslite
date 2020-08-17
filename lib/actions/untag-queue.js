'use strict';

const { untagQueue } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

module.exports = (body) => {
  const tagKeys = Object.keys(body).filter((key) => key.startsWith('Tag'));

  const removeTags = [];
  for (let i = 1; i <= tagKeys.length / 2; i += 1) {
    removeTags.push(body[`Tag.${i}.Key`]);
  }
  const { QueueUrl } = body;

  untagQueue(QueueUrl, removeTags);

  return toXml('UntagQueueResponse', {
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    }
  });
};
