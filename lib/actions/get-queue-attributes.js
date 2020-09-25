'use strict';

const { getQueueAttributes } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

module.exports = (body) => {
  const { QueueUrl } = body;
  const keys = Object.keys(body);

  const attribures = [];
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i].startsWith('AttributeName')) attribures.push(body[keys[i]]);
  }

  try {
    const res = getQueueAttributes(QueueUrl, attribures);
    return toXml('GetQueueAttributesResponse', {
      GetQueueAttributesResult: {
        Attribute: Object.keys(res).map((key) => ({
          Name: key,
          Value: res[key]
        }))
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
