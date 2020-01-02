'use strict';

const dedent = require('dedent');

const { receiveMessage } = require('../sqs');
const { condNextLine } = require('../utils/xml-helper');

module.exports = body => {
  console.log('RECEIVE MESSAGE PARAMS:', body);
  const {
    MaxNumberOfMessages,
    'MessageAttributeName.1': MessageAttribute,
    QueueUrl,
    VisibilityTimeout,
    WaitTimeSeconds
  } = body;

  const params = {
    MaxNumberOfMessages,
    MessageAttribute,
    QueueUrl,
    VisibilityTimeout,
    WaitTimeSeconds
  };

  try {
    const Messages = receiveMessage(params);
    console.log('RECEIVED Messages:', Messages);
    // Body, MD5OfBody, MessageId, ReceiptHandle

    let messages = '';
    // let attributes = '';

    // for (let j = 0; j < Messages.length; j += 1) {
    //   if (Messages[j].MessageAttributes) {
    //     const strAttributes = dedent`
    //     <MessageAttribute>
    //       <Name>${Messages[j].MessageAttributes.Name}</Name>
    //       <Value>${condNextLine`
    //         <StringValue>${Messages[j].MessageAttributes.StringValue}</StringValue>`}${condNextLine`
    //         <BinaryValue>${Messages[j].MessageAttributes.BinaryValue}</BinaryValue>`}
    //         <DataType>${Messages[j].MessageAttributes.DataType}</DataType>
    //       </Value>
    //     </MessageAttribute>
    //     `;
    //     attributes += strAttributes;
    //   }
    // }

    for (let i = 0; i < Messages.length; i += 1) {
      const str = dedent`
      <Message>
      <MessageId>${Messages[i].MessageId}</MessageId>
      <ReceiptHandle>${Messages[i].ReceiptHandle}</ReceiptHandle>
      <MD5OfBody>${Messages[i].MD5OfBody}</MD5OfBody>
      <Body>${Messages[i].Body}</Body>
      </Message>`;
      // console.log('STR:', str);
      messages += str;
      console.log('LENGHT:', Object.keys(Messages[i].MessageAttributes).length);
      if (Messages[i].MessageAttributes) {
        const strAttributes = dedent`
        <MessageAttribute>
          <Name>${Messages[i].MessageAttributes[0].Name}</Name>
          <Value>${condNextLine`
            <StringValue>${Messages[i].MessageAttributes[0].StringValue}</StringValue>`}${condNextLine`
            <BinaryValue>${Messages[i].MessageAttributes[0].BinaryValue}</BinaryValue>`}
            <DataType>${Messages[i].MessageAttributes[0].DataType}</DataType>
          </Value> 
        </MessageAttribute>
        `;
        messages += strAttributes;
      }
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
