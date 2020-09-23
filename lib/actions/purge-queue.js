'use strict';

const { purgeQueue } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

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
