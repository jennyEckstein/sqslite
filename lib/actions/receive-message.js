'use strict';

const dedent = require('dedent');

const { receiveMessage } = require('../sqs');
// const { condNextLine } = require('../utils/xml-helper');

module.exports = body => {
  const { MaxNumberOfMessages, QueueUrl } = body;

  const params = {
    MaxNumberOfMessages,
    QueueUrl
  };

  try {
    const Messages = receiveMessage(params);
    console.log('Messages:', Messages);
    // Body, MD5OfBody, MessageId, ReceiptHandle

    let messages = '';

    for (let i = 0; i < Messages.length; i += 1) {
      const str = dedent`<Message><MessageId>${Messages[i].MessageId}</MessageId><ReceiptHandle>${Messages[i].ReceiptHandle}</ReceiptHandle><MD5OfBody>${Messages[i].MD5OfBody}</MD5OfBody><Body>${Messages[i].Body}</Body></Message>`;
      console.log('STR:', str);
      messages += str;
    }
    console.log('STRING:', messages);
    return dedent`
      <?xml version="1.0"?>
      <ReceiveMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <ReceiveMessageResult>
          ${messages}
        </ReceiveMessageResult>
        <ResponseMetadata>
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ResponseMetadata>
      </ReceiveMessageResponse>
      `;
  } catch (err) {
    const xml = dedent`
    <?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
        <Type>Sender</Type>
        <Code>${err.code}</Code>
        <Message>${err.message}</Message>
        <Detail/>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>`;
    throw Object.assign(err, { xml });
  }
};
