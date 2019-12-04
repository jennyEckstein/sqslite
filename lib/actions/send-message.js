'use strict';

const dedent = require('dedent');

const { sendMessage } = require('../sqs');

module.exports = body => {
  const params = { MessageBody: body.MessageBody, QueueUrl: body.QueueUrl };

  try {
    const message = sendMessage(params);

    return dedent(`
    <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <SendMessageResult>
      <MD5OfMessageBody>${message.MD5OfMessageBody}</MD5OfMessageBody>
      <MessageId>${message.MessageId}</MessageId>
    </SendMessageResult>
    <ResponseMetadata>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ResponseMetadata>
  </SendMessageResponse>`);
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
