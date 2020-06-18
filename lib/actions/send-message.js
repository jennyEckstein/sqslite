'use strict';

const { sendMessage } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');
const { ErrorWithCode } = require('../utils/errors');

// TODO: Binary values in MessageAttributes have encoded value, AWS returns in encoded format when receiving message
module.exports = (body) => {
  const params = {
    DelaySeconds: body.DelaySeconds,
    MessageBody: body.MessageBody,
    MessageGroupId: body.MessageGroupId,
    QueueUrl: body.QueueUrl
  };

  const objs = Object.keys(body).filter(
    (key) => key.startsWith('MessageAttribute') && /MessageAttribute\.(\d{2}|\d)\.Name/.exec(key)
  );

  if (objs.length > 10) {
    throw new ErrorWithCode(
      'Number of message attributes [12] exceeds the allowed maximum [10].',
      'InvalidParameterValue'
    );
  }

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

  const messageSystemAttributes = {};

  if (
    body['MessageSystemAttribute.1.Name'] &&
    body['MessageSystemAttribute.1.Name'] !== 'AWSTraceHeader'
  ) {
    throw new ErrorWithCode(
      `Message system attribute name ${body['MessageSystemAttribute.1.Name']} is invalid.`,
      'InvalidParameterValue'
    );
  } else if (body['MessageSystemAttribute.1.Name'] === 'AWSTraceHeader') {
    messageSystemAttributes.AWSTraceHeader = {
      DataType: body['MessageSystemAttribute.1.Value.DataType']
    };
    if (body['MessageSystemAttribute.1.Value.StringValue']) {
      messageSystemAttributes.AWSTraceHeader = {
        ...messageSystemAttributes.AWSTraceHeader,
        StringValue: body['MessageSystemAttribute.1.Value.StringValue']
      };
    }
    if (body['MessageSystemAttribute.1.Value.BinaryValue']) {
      messageSystemAttributes.AWSTraceHeader = {
        ...messageSystemAttributes.AWSTraceHeader,
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

    return toXml('SendMessageResponse', {
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      },
      SendMessageResult: {
        MD5OfMessageAttributes,
        MD5OfMessageBody,
        MD5OfMessageSystemAttributes,
        MessageId,
        SequenceNumber
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
