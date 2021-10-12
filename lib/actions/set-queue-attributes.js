'use strict';

const { setQueueAttributes } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Set attributes for the queue.
 *
 * @param {Object.<string, string>} body - Request body.
 * @returns {string} SetQueueAttributesResponse in XML format.
 * @throws ErrorResponse in XML format, based on `setQueueAttributes` errors.
 *
 * @example Request body
 * {
 *  QueueUrl: "queueUrl",
 *  "Attribute.1.Name": "DelaySeconds",
 *  "Attribute.1.Value": 10,
 *  "Attribute.2.Name": "MaximumMessageSize",
 *  "Attribute.2.Value": 262144
 * }
 */
module.exports = (body) => {
  const { QueueUrl } = body;
  const keys = Object.keys(body);

  const attributeKeys = keys.filter((key) => key.startsWith('Attribute'));
  const Attributes = {};
  for (let i = 1; i <= attributeKeys.length / 2; i += 1) {
    Attributes[body[`Attribute.${i}.Name`]] = body[`Attribute.${i}.Value`];
  }

  if (Attributes.RedrivePolicy) {
    Attributes.RedrivePolicy = JSON.parse(Attributes.RedrivePolicy);
  }

  if (Attributes.FifoQueue) {
    Attributes.FifoQueue = Attributes.FifoQueue === 'true';
  }

  if (Attributes.ContentBasedDeduplication) {
    Attributes.ContentBasedDeduplication = Attributes.ContentBasedDeduplication === 'true';
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
