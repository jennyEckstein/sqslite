'use strict';

const { listDeadLetterSourceQueues } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');

module.exports = ({ QueueUrl }, host) => {
  try {
    return toXml('ListDeadLetterSourceQueuesResponse', {
      ListDeadLetterSourceQueuesResult: {
        QueueUrl: listDeadLetterSourceQueues(QueueUrl, host)
      },
      ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
