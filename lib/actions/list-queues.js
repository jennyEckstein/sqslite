'use strict';

const builder = require('xmlbuilder');
const { listQueues } = require('../sqs');

module.exports = () => {
  const list = listQueues();

  const obj = {
    ListQueuesResponse: {
      '@xmlns': 'http://queue.amazonaws.com/doc/2012-11-05/',
      ListQueuesResult: [
        {
          QueueUrl: () => {
            return list.map(i => i);
          }
        }
      ],
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      }
    }
  };

  return builder.create(obj).end({ pretty: true });
};
