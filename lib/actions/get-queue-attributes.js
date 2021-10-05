'use strict';

const { getQueueAttributes } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Action Handler for retrieving the attribute of the queue.
 *
 * @param {{
 *  QueueUrl: string,
 *  "AttributeName.i": string|undefined
 * }} body - Request body.
 * @returns {string} XMLGetQueueAttributesResponse.
 * @throws XMLErrors, based on getQueueAttributes's errors.
 * 
 * @example Request body
 * {
 *  QueueUrl: "queueUrl",
 *  "AttributeName.1": "ApproximateNumberOfMessages",
 *  "AttributeName.2": "DelaySeconds"
}
 */
module.exports = (body) => {
  const { QueueUrl } = body;
  const keys = Object.keys(body);

  const attributes = [];
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i].startsWith('AttributeName')) attributes.push(body[keys[i]]);
  }

  try {
    const res = getQueueAttributes(QueueUrl, attributes);
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
