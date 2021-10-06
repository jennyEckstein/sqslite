'use strict';

const { sendMessageBatch } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Helper for processing the params for send batch message.
 *
 * @param {Object} body - Request body.
 * @param {string} body.Id - The id of message.
 * @param {number} body.DelaySeconds - The duration in seconds for the message to be delayed.
 * @param {string} body.MessageBody - The body of message.
 * @returns {Object} Sanitized parameter object.
 */
function processParams(body) {
  const { DelaySeconds, Id, MessageBody } = body;
  const params = { DelaySeconds, Id, MessageBody };

  const objs = Object.keys(body).filter(
    (key) => key.startsWith('MessageAttribute') && /MessageAttribute\.(\d{2}|\d)\.Name/.exec(key)
  );

  const messageAttributes = objs.reduce((acc, obj, index) => {
    const i = index + 1; // Starts at 1
    acc[body[`MessageAttribute.${i}.Name`]] = {
      DataType: body[`MessageAttribute.${i}.Value.DataType`]
    };

    if (body[`MessageAttribute.${i}.Value.StringValue`]) {
      acc[body[`MessageAttribute.${i}.Name`]].StringValue =
        body[`MessageAttribute.${i}.Value.StringValue`];
    }

    if (body[`MessageAttribute.${i}.Value.BinaryValue`]) {
      acc[body[`MessageAttribute.${i}.Name`]].BinaryValue =
        body[`MessageAttribute.${i}.Value.BinaryValue`];
    }

    return acc;
  }, {});

  if (Object.keys(messageAttributes).length > 0) {
    params.MessageAttributes = messageAttributes;
  }

  return params;
}

/**
 * Send messages in batch to the queue.
 *
 * @param {{
 *  QueueUrl: string,
 *  "SendMessageBatchRequestEntry.i.Id": string|undefined,
 *  "SendMessageBatchRequestEntry.i.MessageBody": string|undefined,
 *  "SendMessageBatchRequestEntry.i.DelaySeconds": number|undefined,
 *  "SendMessageBatchRequestEntry.i.MessageAttribute.j.Name": string|undefined,
 *  "SendMessageBatchRequestEntry.i.MessageAttribute.j.Value": string|undefined
 * }} body - Request body.
 * @returns {string} SendMessageBatchResponse in XML format.
 * @throws ErrorResponse in XML format, based on sendMessageBatch's errors.
 *
 * @example Request body
 * {
 *  QueueUrl: "queueUrl",
 *  "SendMessageBatchRequestEntry.1.Id": "messageId",
 *  "SendMessageBatchRequestEntry.1.MessageBody": "Message body for messageId",
 *  "SendMessageBatchRequestEntry.1.DelaySeconds": 10,
 *  "SendMessageBatchRequestEntry.1.MessageAttributes.1.Name": "MessageAttribute1",
 *  "SendMessageBatchRequestEntry.1.MessageAttributes.1.Value.DataType": "String",
 *  "SendMessageBatchRequestEntry.1.MessageAttributes.1.Value.StringValue": "MessageAttribute1String"
 * }
 */
module.exports = (body) => {
  const bodyKeys = Object.keys(body);
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
