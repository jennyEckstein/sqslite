'use strict';

const builder = require('xmlbuilder');
const { receiveMessage } = require('../sqs');

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
                MD5OfMessageAttributes: Messages[j].MD5OfMessageAttributes,
                MessageId: Messages[j].MessageId,
                ReceiptHandle: Messages[j].ReceiptHandle,
                MD5OfBody: Messages[j].MD5OfBody,
                Body: Messages[j].Body,
                MessageAttribute: () => {
                  const keys = Messages[j].MessageAttributes
                    ? Object.keys(Messages[j].MessageAttributes)
                    : 0;
                  if (keys.length === 0) return [];

                  const attributes = [];
                  for (let i = 0; i < keys.length; i += 1) {
                    const attr = {
                      Name: keys[i],
                      Value: {
                        DataType: Messages[j].MessageAttributes[keys[i]].DataType,
                        ...(Messages[j].MessageAttributes[keys[i]].StringValue && {
                          StringValue: Messages[j].MessageAttributes[keys[i]].StringValue
                        }),
                        ...(Messages[j].MessageAttributes[keys[i]].BinaryValue && {
                          BinaryValue: Messages[j].MessageAttributes[keys[i]].BinaryValue
                        })
                      }
                    };

                    attributes.push(attr);
                  }
                  return attributes;
                }
              };
            }
          }
        },
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      }
    };

    const xml = builder.create(obj).end({ pretty: true });

    return xml;
  } catch (err) {
    const obj = {
      ErrorResponse: {
        '@xmlns': 'http://queue.amazonaws.com/doc/2012-11-05/',
        Error: {
          Type: 'Sender',
          Code: err.code,
          Message: err.message,
          Detail: {}
        },
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    };
    const xml = builder.create(obj).end({ pretty: true });
    throw Object.assign(err, { xml });
  }
};
