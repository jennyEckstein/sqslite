'use strict';

const dedent = require('dedent');

const { sendMessage } = require('../sqs');
const { condNextLine } = require('../utils/xml-helper');

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

    return dedent`
      <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <SendMessageResult>
        <MD5OfMessageBody>${MD5OfMessageBody}</MD5OfMessageBody>${condNextLine`
        <MD5OfMessageAttributes>${MD5OfMessageAttributes}</MD5OfMessageAttributes>`}${condNextLine`
        <MD5OfMessageSystemAttributes>${MD5OfMessageSystemAttributes}</MD5OfMessageSystemAttributes>`}
        <MessageId>${MessageId}</MessageId>${condNextLine`
        <SequenceNumber>${SequenceNumber}</SequenceNumber>`}
      </SendMessageResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </SendMessageResponse>
  `;
  } catch (err) {
    const xml = dedent(`
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <Error>
      <Type>Sender</Type>
      <Code>${err.code}</Code>
      <Message>${err.message}</Message>
      <Detail/>
    </Error>
    <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
  </ErrorResponse>`);
    throw Object.assign(err, { xml });
  }
};
