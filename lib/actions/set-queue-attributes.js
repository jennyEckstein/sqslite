'use strict';

const { setQueueAttributes } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

module.exports = (body) => {
  const { QueueUrl } = body;
  const keys = Object.keys(body);

  const attributeKeys = keys.filter((key) => key.startsWith('Attribute'));
  const Attributes = {};
  for (let i = 1; i <= attributeKeys.length / 2; i += 1) {
    Attributes[body[`Attribute.${i}.Name`]] = body[`Attribute.${i}.Value`];
  }

  try {
    setQueueAttributes(QueueUrl, Attributes);
    return toXml('SetQueueAttributesResponse', {
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
