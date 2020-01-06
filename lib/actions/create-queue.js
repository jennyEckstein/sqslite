'use strict';

const builder = require('xmlbuilder');
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

    const obj = {
      CreateQueueResponse: {
        CreateQueueResult: {
          QueueUrl: queueUrl
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
        Error: {
          Code: err.code,
          Detail: {},
          Message: err.message,
          Type: 'Sender'
        },
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    };
    const xml = builder.create(obj).end({ pretty: true });
    throw Object.assign(err, { xml });
  }
};
