'use strict';

const { getQueueUrl } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

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
