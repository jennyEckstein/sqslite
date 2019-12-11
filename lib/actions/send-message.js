'use strict';

const dedent = require('dedent');

const { sendMessage } = require('../sqs');

// TODO: Binary values in MessageAttributes have encoded value
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

  params.MessageAttributes = messageAttributes;
  const blankLines = new RegExp(/(^[ \t]*\n)/, 'gm');

  try {
    const message = sendMessage(params);
    // TODO: conditional xml properties
    return dedent(
      `
    <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <SendMessageResult>
      <MD5OfMessageBody>${message.MD5OfMessageBody}</MD5OfMessageBody>
      ${
        message.MD5OfMessageAttributes
          ? `<MD5OfMessageAttributes>${message.MD5OfMessageAttributes}</MD5OfMessageAttributes>`
          : ''
      }
      <MessageId>${message.MessageId}</MessageId>
      ${message.SequenceNumber ? `<SequenceNumber>${message.SequenceNumber}</SequenceNumber>` : ''}
    </SendMessageResult>
    <ResponseMetadata>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ResponseMetadata>
  </SendMessageResponse>`.replace(blankLines, '')
    );
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
