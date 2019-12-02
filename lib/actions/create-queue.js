'use strict';

const dedent = require('dedent');
const { createQueue } = require('../sqs');

module.exports = body => {
  const params = { QueueName: body.QueueName };

  const keys = Object.keys(body);

  // parse attributes
  const attributeKeys = keys.filter(key => key.startsWith('Attribute'));
  const Attributes = {};
  for (let i = 1; i <= attributeKeys.length / 2; i += 1) {
    Attributes[body[`Attribute.${i}.Name`]] = body[`Attribute.${i}.Value`];
  }

  // parse tags
  const tagKeys = keys.filter(key => key.startsWith('Tag'));
  const Tags = {};
  for (let i = 1; i <= tagKeys.length / 2; i += 1) {
    Tags[body[`Tag.${i}.Key`]] = body[`Tag.${i}.Value`];
  }

  if (Attributes.RedrivePolicy) {
    Attributes.RedrivePolicy = JSON.parse(Attributes.RedrivePolicy);
  }

  if (Attributes.FifoQueue) {
    Attributes.FifoQueue = Attributes.FifoQueue === 'true';
  }

  if (Attributes.ContentBasedDeduplication) {
    Attributes.ContentBasedDeduplication = Attributes.ContentBasedDeduplication === 'true';
  }

  try {
    const queueUrl = createQueue(Object.assign(params, { Attributes, tags: Tags }));

    return dedent(`<CreateQueueResponse>
      <CreateQueueResult>
        <QueueUrl>${queueUrl}</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </CreateQueueResponse>`);
  } catch (err) {
    const xml = `<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
    <Error>
    <Type>Sender</Type>
    <Code>${err.code}</Code>
    <Message>${err.message}</Message>
    <Detail/>
    </Error>
    <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;
    throw Object.assign(err, { xml: dedent(xml) });
  }
};
