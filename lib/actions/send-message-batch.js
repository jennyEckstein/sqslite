'use strict';

const { sendMessageBatch } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

// TODO: could be combined with send-message
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
