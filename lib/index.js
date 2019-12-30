'use strict';

const fastify = require('fastify');
const fastifyFormBody = require('fastify-formbody');
const createQueue = require('./actions/create-queue');
const listQueues = require('./actions/list-queues');
const sendMessage = require('./actions/send-message');
const receiveMessage = require('./actions/receive-message');

module.exports = opts => {
  const app = fastify({
    logger: true,
    ...opts
  });

  app.register(fastifyFormBody);

  app.post('/', async (request, reply) => {
    const { body } = request;

    console.log('BODY:', body);
    reply.header('Content-Type', 'application/xml');
    try {
      switch (body && body.Action) {
        case 'ListQueues':
          return listQueues();
        case 'CreateQueue':
          return createQueue(body);
        case 'SendMessage':
          return sendMessage(body);
        case 'ReceiveMessage':
          return receiveMessage(body);
        default:
          return `Action: ${body.Action} is not implemented`;
      }
    } catch (err) {
      reply.status(400);
      return err.xml;
    }
  });

  return app;
};
