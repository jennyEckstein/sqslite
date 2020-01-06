'use strict';

const builder = require('xmlbuilder');
const { sendMessage } = require('../sqs');

// TODO: Binary values in MessageAttributes have encoded value, AWS returns in encoded format when receiving message
module.exports = body => {
  const params = {
    DelaySeconds: body.DelaySeconds,
    MessageBody: body.MessageBody,
    MessageGroupId: body.MessageGroupId,
    QueueUrl: body.QueueUrl
  };

  const keys = Object.keys(body);

  const messageAttributeKeys = keys.filter(key => key.startsWith('MessageAttribute'));

  // how many exactly
  const objs = messageAttributeKeys.filter(key =>
    /MessageAttribute\.(\d{2}|\d{1})\.Name/.exec(key)
  );

  if (objs.length > 10) {
    throw Object.assign(
      new Error('Number of message attributes [12] exceeds the allowed maximum [10].'),
      {
        code: 'InvalidParameterValue'
      }
    );
  }

  const messageAttributes = {};
  // rebuild objs
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

  const messageSystemAttributes = {};

  if (
    body['MessageSystemAttribute.1.Name'] &&
    body['MessageSystemAttribute.1.Name'] !== 'AWSTraceHeader'
  ) {
    throw Object.assign(
      new Error(
        `Message system attribute name ${body['MessageSystemAttribute.1.Name']} is invalid.`
      ),
      {
        code: 'InvalidParameterValue'
      }
    );
  } else if (body['MessageSystemAttribute.1.Name'] === 'AWSTraceHeader') {
    messageSystemAttributes.AWSTraceHeader = {
      DataType: body['MessageSystemAttribute.1.Value.DataType']
    };
    if (body['MessageSystemAttribute.1.Value.StringValue']) {
      messageSystemAttributes.AWSTraceHeader = {
        StringValue: body['MessageSystemAttribute.1.Value.StringValue']
      };
    }
    if (body['MessageSystemAttribute.1.Value.BinaryValue']) {
      messageSystemAttributes.AWSTraceHeader = {
        StringValue: body['MessageSystemAttribute.1.Value.BinaryValue']
      };
    }
  }

  if (Object.keys(messageSystemAttributes).length > 0) {
    params.MessageSystemAttributes = messageSystemAttributes;
  }

  try {
    const {
      MD5OfMessageAttributes,
      MD5OfMessageBody,
      MD5OfMessageSystemAttributes,
      MessageId,
      SequenceNumber
    } = sendMessage(params);

    const obj = {
      SendMessageResponse: {
        '@xmlns': 'http://queue.amazonaws.com/doc/2012-11-05/',
        SendMessageResult: {
          MD5OfMessageBody,
          MD5OfMessageAttributes,
          MD5OfMessageSystemAttributes,
          MessageId,
          SequenceNumber
        },
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      }
    };

    return builder.create(obj).end({ pretty: true });
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
