'use strict';

const { listQueues } = require('../sqs');

module.exports = () => {
  return listQueues();
};
