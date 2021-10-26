'use strict';

const { MessageBatchObject, sendMessageBatch } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Helper for processing the params for send batch messages.
 *
 * @param {Object.<string, any>} body - Request body.
 * @returns {MessageBatchObject} Sanitized parameter object.
 */
function processParams(body) {
  const { DelaySeconds, Id, MessageBody } = body;
  /** @type {MessageBatchObject} */
  const params = { DelaySeconds, Id, MessageBody };

  const objs = Object.keys(body).filter(
    (key) => key.startsWith('MessageAttribute') && /MessageAttribute\.(\d{2}|\d)\.Name/.exec(key)
  );

  /** @type {Object.<string, any>} */
  const messageAttributes = {};

  for (let i = 1; i <= objs.length; i += 1) {
    messageAttributes[body[`MessageAttribute.${i}.Name`]] = {
      DataType: body[`MessageAttribute.${i}.Value.DataType`]
    };

    if (body[`MessageAttribute.${i}.Value.StringValue`]) {
      messageAttributes[body[`MessageAttribute.${i}.Name`]].StringValue =
        body[`MessageAttribute.${i}.Value.StringValue`];
    }

    if (body[`MessageAttribute.${i}.Value.BinaryValue`]) {
      messageAttributes[body[`MessageAttribute.${i}.Name`]].BinaryValue =
        body[`MessageAttribute.${i}.Value.BinaryValue`];
    }
  }

  if (Object.keys(messageAttributes).length > 0) {
    params.MessageAttributes = messageAttributes;
  }

  return params;
}

/**
 * Send messages in batch to the queue.
 *
 * @param {Object.<string, any>} body - Request body.
 * @returns {string} SendMessageBatchResponse in XML format.
 * @throws ErrorResponse in XML format, based on sendMessageBatch's errors.
 */
module.exports = (body) => {
  const bodyKeys = Object.keys(body);
  /** @type {Object.<string, any>} */
  const result = {};

  for (const key of bodyKeys) {
    if (key.startsWith('SendMessageBatchRequestEntry')) {
      const start = 'SendMessageBatchRequestEntry.'.length;
      let end = key.indexOf('.MessageAttribute');

      let index = key.slice(start, end);

      if (start >= end) {
        if (key.indexOf('.DelaySeconds') > 0) end = key.indexOf('.DelaySeconds');
        if (key.indexOf('.Id') > 0) end = key.indexOf('.Id');
        if (key.indexOf('.MessageBody') > 0) end = key.indexOf('.MessageBody');

        index = key.slice(start, end);
      }
      result[index] = [...(result[index] || []), key];
    }
  }

  const finalRes = [];
  for (let i = 1; i <= Object.keys(result).length; i += 1) {
    /** @type {Object.<string, any>} */
    const prep = {};
    for (const key of result[i]) {
      const start = `SendMessageBatchRequestEntry.${i}.`.length;
      const end = key.length;

      prep[key.slice(start, end)] = body[key];
    }

    finalRes.push(processParams(prep));
  }

  try {
    return toXml('SendMessageBatchResponse', {
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      },
      SendMessageBatchResult: {
        SendMessageBatchResultEntry: sendMessageBatch({
          QueueUrl: body.QueueUrl,
          messages: finalRes
        })
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
