'use strict';

const { receiveMessage } = require('../sqs');
const { toXml } = require('../utils/xml-helper');

module.exports = body => {
  const { MaxNumberOfMessages, QueueUrl, VisibilityTimeout, WaitTimeSeconds } = body;

  // Check for MessageAttributeNames
  const keys = Object.keys(body);
  const messageAttributeKeys = keys.filter(key => key.startsWith('MessageAttributeName'));
  const attributes = messageAttributeKeys.map(attr => body[attr]);

  const params = {
    MaxNumberOfMessages,
    MessageAttributeNames: attributes,
    QueueUrl,
    VisibilityTimeout,
    WaitTimeSeconds
  };

  try {
    const Messages = receiveMessage(params);

    Messages.map(m => {
      return m;
    });

    const obj = {
      ReceiveMessageResponse: {
        '@xmlns': 'http://queue.amazonaws.com/doc/2012-11-05/',
        ReceiveMessageResult: {
          Message: () => {
            for (let j = 0; j < Messages.length; j += 1) {
              return {
                Body: Messages[j].Body,
                MD5OfBody: Messages[j].MD5OfBody,
                MD5OfMessageAttributes: Messages[j].MD5OfMessageAttributes,
                MessageAttribute: () => {
                  const msgAttrKeys = Messages[j].MessageAttributes
                    ? Object.keys(Messages[j].MessageAttributes)
                    : 0;
                  if (msgAttrKeys.length === 0) return [];

                  const msgAttributes = [];
                  for (let i = 0; i < msgAttrKeys.length; i += 1) {
                    const attr = {
                      Name: msgAttrKeys[i],
                      Value: {
                        DataType: Messages[j].MessageAttributes[msgAttrKeys[i]].DataType,
                        ...(Messages[j].MessageAttributes[msgAttrKeys[i]].StringValue && {
                          StringValue: Messages[j].MessageAttributes[msgAttrKeys[i]].StringValue
                        }),
                        ...(Messages[j].MessageAttributes[msgAttrKeys[i]].BinaryValue && {
                          BinaryValue: Messages[j].MessageAttributes[msgAttrKeys[i]].BinaryValue
                        })
                      }
                    };

                    msgAttributes.push(attr);
                  }
                  return msgAttributes;
                },
                MessageId: Messages[j].MessageId,
                ReceiptHandle: Messages[j].ReceiptHandle
              };
            }
            return [];
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
