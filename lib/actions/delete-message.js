'use strict';

const { deleteMessage } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

module.exports = ({ QueueUrl, ReceiptHandle }) => {
  const params = { QueueUrl, ReceiptHandle };

  deleteMessage(params);
  return toXml('DeleteMessageResponse', {
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    }
  });
};
