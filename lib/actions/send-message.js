'use strict';

const dedent = require('dedent');

const { sendMessage } = require('../sqs');

// TODO: Binary values in MessageAttributes have encoded value, - just store and return as is, test convert back with base64
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

  try {
    const { MD5OfMessageAttributes, MD5OfMessageBody, MessageId, SequenceNumber } = sendMessage(
      params
    );
    // TODO: conditional xml properties

    const condNextLine = ([startTag, endTag], value) => {
      if (value === undefined) return '';
      return [startTag, value, endTag].join('');
    };

    return dedent`
      <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <SendMessageResult>
        <MD5OfMessageBody>${MD5OfMessageBody}</MD5OfMessageBody>${condNextLine`
        <MD5OfMessageAttributes>${MD5OfMessageAttributes}</MD5OfMessageAttributes>`}
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
