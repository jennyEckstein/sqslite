'use strict';

const fastify = require('fastify');
const fastifyFormBody = require('fastify-formbody');

const createQueue = require('./actions/create-queue');
const listQueues = require('./actions/list-queues');
const sendMessage = require('./actions/send-message');
const sendMessageBatch = require('./actions/send-message-batch');
const receiveMessage = require('./actions/receive-message');
const deleteMessage = require('./actions/delete-message');
const deleteQueue = require('./actions/delete-queue');
const tagQueue = require('./actions/tag-queue');
const listQueueTags = require('./actions/list-queue-tags');
const untagQueue = require('./actions/untag-queue');
const setQueueAttributes = require('./actions/set-queue-attributes');
const getQueueAttributes = require('./actions/get-queue-attributes');
const getQueueUrl = require('./actions/get-queue-url');
const purgeQueue = require('./actions/purge-queue');
const deleteMessageBatch = require('./actions/delete-message-batch');
const listDeadLetterSourceQueues = require('./actions/list-dead-letter-source-queues');
const changeMessageVisibility = require('./actions/change-message-visibility');

/**
 * Sets up the server instance.
 *
 * @param {Object} opts - Additional server options
 * @returns {fastify.FastifyInstance} - Returns the server instance.
 */
module.exports = (opts) => {
  const app = fastify({
    logger: true,
    ...opts
  });

  app.register(fastifyFormBody);

  app.post('/', async (request, reply) => {
    const { body, headers } = request;
    const { host } = headers;

    reply.header('Content-Type', 'application/xml');
    try {
      switch (body && body.Action) {
        case 'ListQueues':
          return listQueues();
        case 'CreateQueue':
          return createQueue(body, host);
        case 'SendMessage':
          return sendMessage(body);
        case 'ReceiveMessage':
          return receiveMessage(body);
        case 'DeleteMessage':
          return deleteMessage(body);
        case 'DeleteMessageBatch':
          return deleteMessageBatch(body);
        case 'SendMessageBatch':
          return sendMessageBatch(body);
        case 'DeleteQueue':
          return deleteQueue(body);
        case 'TagQueue':
          return tagQueue(body);
        case 'ListQueueTags':
          return listQueueTags(body);
        case 'UntagQueue':
          return untagQueue(body);
        case 'SetQueueAttributes':
          return setQueueAttributes(body);
        case 'GetQueueAttributes':
          return getQueueAttributes(body);
        case 'GetQueueUrl':
          return getQueueUrl(body, host);
        case 'PurgeQueue':
          return purgeQueue(body);
        case 'ListDeadLetterSourceQueues':
          return listDeadLetterSourceQueues(body, host);
        case 'ChangeMessageVisibility':
          return changeMessageVisibility(body);
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
