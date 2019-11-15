'use strict';

const fastify = require('fastify')({
  logger: true
});

const { createQueue, listQueues } = require('./sqs');

fastify.post('/create-queue', async request => {
  try {
    return createQueue(request.body);
  } catch (err) {
    fastify.log.error(err);
    return err;
  }
});

fastify.get('/list-queues', async () => {
  try {
    return listQueues();
  } catch (err) {
    fastify.log.error(err);
    return err;
  }
});

module.exports = fastify;
