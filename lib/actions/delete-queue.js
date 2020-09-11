'use strict';

const { deleteQueue } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

module.exports = ({ QueueUrl }) => {
  const params = { QueueUrl };

  deleteQueue(params);

  return toXml('DeleteQueueResponse', {
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    }
  });
};
