'use strict';

const { changeMessageVisibility } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

module.exports = ({ QueueUrl, ReceiptHandle, VisibilityTimeout }) => {
  try {
    changeMessageVisibility({ QueueUrl, ReceiptHandle, VisibilityTimeout });
    return toXml('ChangeMessageVisibilityResponse', {
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
