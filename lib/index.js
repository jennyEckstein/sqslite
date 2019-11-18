'use strict';

const fastify = require('fastify');
const fastifyFormBody = require('fastify-formbody');
const { createQueue, listQueues } = require('./sqs');

module.exports = opts => {
  const app = fastify({
    ...opts,
    logger: true
  });

  app.register(fastifyFormBody);

  app.post('/', async (request, reply) => {
    const { body } = request;
    console.warn('BODY:', body);

    reply.header('Content-Type', 'application/xml');
    switch (body.Action) {
      case 'ListQueues':
        return listQueues();
      case 'CreateQueue':
        return createQueue({ QueueName: body.QueueName });
      default:
        return '?';
    }
  });

  return app;
};
