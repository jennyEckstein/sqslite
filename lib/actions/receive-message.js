'use strict';

const { receiveMessage } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

/**
 * Retrieves a message from the queue.
 *
 * @param {{
 *  QueueUrl: string,
 *  MaxNumberOfMessages: number,
 *  VisibilityTimeout: number,
 *  WaitTimeSeconds: number,
 *  "AttributeName.i": string,
 *  "MessageAttributeName.i": string
 * }} body - Request body.
 * @returns {string} ReceiveMessageResponse in XML format.
 * @throws ErrorResponse in XML format, based on `receiveMessage` errors.
 *
 * @example
 * {
 *  QueueUrl: "queueUrl",
 *  "AttributeName.1": "All",
 *  "MessageAttributeName.1": "msgAttribute1",
 *  "MessageAttributeName.2": "msgAttribute2",
 *  "MessageAttributeName.3": "msgAttribute3"
 * }
 */
module.exports = (body) => {
  const { MaxNumberOfMessages, QueueUrl, VisibilityTimeout, WaitTimeSeconds } = body;

  const { attributes, messageAttributes } = Object.entries(body).reduce(
    (acc, [key, value]) => {
      if (key.startsWith('MessageAttributeName')) {
        acc.messageAttributes.push(value);
      }

      if (key.startsWith('AttributeName')) {
        acc.attributes.push(value);
      }

      return acc;
    },
    { attributes: [], messageAttributes: [] }
  );

  const params = {
    AttributeNames: attributes,
    MaxNumberOfMessages,
    MessageAttributeNames: messageAttributes,
    QueueUrl,
    VisibilityTimeout,
    WaitTimeSeconds
  };

  try {
    const Messages = receiveMessage(params);

    return toXml('ReceiveMessageResponse', {
      ReceiveMessageResult: {
        Message: () =>
          Messages.map(
            ({
              Attributes = {},
              Body,
              MD5OfBody,
              MD5OfMessageAttributes,
              MessageAttributes = {},
              MessageId,
              ReceiptHandle
            }) => ({
              Attribute: () =>
                Object.keys(Attributes).map((attrKey) => ({
                  Name: attrKey,
                  Value: Attributes[attrKey]
                })),
              Body,
              MD5OfBody,
              MD5OfMessageAttributes,
              MessageAttribute: () =>
                Object.keys(MessageAttributes).map((attrKey) => ({
                  Name: attrKey,
                  Value: {
                    DataType: MessageAttributes[attrKey].DataType,
                    ...(MessageAttributes[attrKey].StringValue && {
                      StringValue: MessageAttributes[attrKey].StringValue
                    }),
                    ...(MessageAttributes[attrKey].BinaryValue && {
                      BinaryValue: MessageAttributes[attrKey].BinaryValue
                    })
                  }
                })),
              MessageId,
              ReceiptHandle
            })
          )
      },
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
