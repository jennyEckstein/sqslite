'use strict';

const { receiveMessage } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

module.exports = body => {
  const { MaxNumberOfMessages, QueueUrl, VisibilityTimeout, WaitTimeSeconds } = body;

  // Check for MessageAttributeNames
  const keys = Object.keys(body);
  const messageAttributeKeys = keys.filter(key => key.startsWith('MessageAttributeName'));
  const messageAttributes = messageAttributeKeys.map(attr => body[attr]);

  const attributeKeys = keys.filter(key => key.startsWith('AttributeName'));
  const attributes = attributeKeys.map(attr => body[attr]);

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
              Attributes,
              Body,
              MD5OfBody,
              MD5OfMessageAttributes,
              MessageAttributes,
              MessageId,
              ReceiptHandle
            }) => ({
              Attribute: () => {
                const attrKeys = Attributes ? Object.keys(Attributes) : [];
                if (attrKeys.length === 0) return [];
                return attrKeys.map(attrKey => ({
                  Name: attrKey,
                  Value: Attributes[attrKey]
                }));
              },
              Body,
              MD5OfBody,
              MD5OfMessageAttributes,
              MessageAttribute: () => {
                const msgAttrKeys = MessageAttributes ? Object.keys(MessageAttributes) : [];
                if (msgAttrKeys.length === 0) return [];
                return msgAttrKeys.map(attrKey => ({
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
                }));
              },
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
