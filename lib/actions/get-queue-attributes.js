'use strict';

const { getQueueAttributes } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

module.exports = (body) => {
  const { QueueUrl } = body;
  const keys = Object.keys(body);

  const attribures = [];
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i].startsWith('Attribute')) attribures.push(body[keys[i]]);
  }

  try {
    const res = getQueueAttributes(QueueUrl, attribures);
    const resKeys = Object.keys(res);

    return toXml('GetQueueAttributesResponse', {
      GetQueueAttributesResult: {
        Attribute: resKeys.map((key) => ({ Name: key, Value: res[key] }))
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }

  /**
  body: {
    Action: 'GetQueueAttributes',
    QueueUrl: 'http://localhost:3001/queues/jenny-test',
    Version: '2012-11-05',
    'AttributeName.1': 'RedrivePolicy'
  }
   
  body: {
  Action: 'GetQueueAttributes',
  QueueUrl: 'http://localhost:3001/queues/jenny-test',
  Version: '2012-11-05',
  'AttributeName.1': 'All'
}
   
body: {
  Action: 'GetQueueAttributes',
  QueueUrl: 'http://localhost:3001/queues/jenny-test',
  'AttributeName.2': 'QueueArn',
  Version: '2012-11-05',
  'AttributeName.1': 'DelaySeconds'
}
   */
};

// test({
//   Action: 'GetQueueAttributes',
//   QueueUrl: 'http://localhost:3001/queues/jenny-test',
//   'AttributeName.2': 'QueueArn',
//   Version: '2012-11-05',
//   'AttributeName.1': 'DelaySeconds'
// });
