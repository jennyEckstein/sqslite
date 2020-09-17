'use strict';

const { getQueueUrl } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

module.exports = ({ QueueName }, host) =>
  toXml('GetQueueUrlResponse', {
    GetQueueUrlResult: {
      QueueUrl: getQueueUrl(QueueName, host)
    },
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    }
  });
