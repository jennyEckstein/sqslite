'use strict';

const { receiveMessage } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

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

    const obj = {
      ReceiveMessageResponse: {
        '@xmlns': 'http://queue.amazonaws.com/doc/2012-11-05/',
        ReceiveMessageResult: {
          Message: () => {
            return Messages.map(msg => {
              const {
                Attributes,
                Body,
                MD5OfBody,
                MD5OfMessageAttributes,
                MessageAttributes,
                MessageId,
                ReceiptHandle
              } = msg;
              return {
                Attribute: () => {
                  const attrKeys = Attributes ? Object.keys(Attributes) : [];

                  if (attrKeys.length === 0) return [];
                  const attributesArr = [];
                  attrKeys.map(attrKey => {
                    const attr = {
                      Name: attrKey,
                      Value: Attributes[attrKey]
                    };
                    return attributesArr.push(attr);
                  });

                  return attributesArr;
                },
                Body,
                MD5OfBody,
                MD5OfMessageAttributes,
                MessageAttribute: () => {
                  const msgAttrKeys = MessageAttributes ? Object.keys(MessageAttributes) : [];

                  if (msgAttrKeys.length === 0) return [];

                  const msgAttributes = [];

                  msgAttrKeys.map(attrKey => {
                    const attr = {
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
                    };
                    return msgAttributes.push(attr);
                  });

                  return msgAttributes;
                },
                MessageId,
                ReceiptHandle
              };
            });
          }
        },
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      }
    };

    return toXml(obj);
  } catch (err) {
    const obj = {
      ErrorResponse: {
        '@xmlns': 'http://queue.amazonaws.com/doc/2012-11-05/',
        Error: {
          Code: err.code,
          Detail: {},
          Message: err.message,
          Type: 'Sender'
        },
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    };
    const xml = toXml(obj);
    throw Object.assign(err, { xml });
  }
};
