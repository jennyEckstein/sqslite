'use strict';

const { deleteMessageBatch } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Delete messages in batch from the queue.
 *
 * @param {Object.<string, string>} body - Request body.
 * @returns {string} DeleteMessageBatchResponse in XML format.
 * @throws ErrorResponse in XML format, based on `deleteMessageBatch` errors.
 */
module.exports = (body) => {
  const { QueueUrl } = body;
  const keys = Object.keys(body);
  const entries = keys.filter((key) => key.startsWith('DeleteMessageBatchRequestEntry'));

  const Entries = [];
  for (let i = 1; i <= entries.length / 2; i += 1) {
    Entries.push({
      Id: body[`DeleteMessageBatchRequestEntry.${i}.Id`],
      ReceiptHandle: body[`DeleteMessageBatchRequestEntry.${i}.ReceiptHandle`]
    });
  }

  try {
    return toXml('DeleteMessageBatchResponse', {
      DeleteMessageBatchResult: {
        DeleteMessageBatchResultEntry: deleteMessageBatch(QueueUrl, Entries).map((Id) => ({ Id }))
      },
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
