'use strict';

const { createQueue } = require('../sqs');

function parseAttributes(params) {
  const keys = Object.keys(params);
  const attributeKeys2 = keys.filter(key => key.startsWith('Attribute'));
  const Attributes = {};
  for (let i = 1; i <= attributeKeys2.length / 2; i += 1) {
    Attributes[params[`Attribute.${i}.Name`]] = params[`Attribute.${i}.Value`];
  }
  return Attributes;
}

module.exports = body => {
  const Attributes = parseAttributes(body);
  return createQueue({ Attributes, QueueName: body.QueueName });
};
