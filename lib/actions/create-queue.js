'use strict';

const { createQueue } = require('../sqs');

function parseAttributes(params) {
  const keys = Object.keys(params);
  const attributeKeys = keys.filter(key => key.startsWith('Attribute'));
  const Attributes = {};
  for (let i = 1; i <= attributeKeys.length / 2; i += 1) {
    Attributes[params[`Attribute.${i}.Name`]] = params[`Attribute.${i}.Value`];
  }
  return Attributes;
}

function parseTags(params) {
  const keys = Object.keys(params);
  const tagKeys = keys.filter(key => key.startsWith('Tag'));
  const Tags = {};
  for (let i = 1; i <= tagKeys.length / 2; i += 1) {
    Tags[params[`Tag.${i}.Key`]] = params[`Tag.${i}.Value`];
  }
  return Tags;
}

function formatRedrivePolicy(redrivePolicy) {
  return JSON.parse(redrivePolicy);
}

module.exports = body => {
  const Attributes = parseAttributes(body);
  const Tags = parseTags(body);
  if (Attributes.RedrivePolicy) {
    Attributes.RedrivePolicy = formatRedrivePolicy(Attributes.RedrivePolicy);
  }

  return createQueue({ Attributes, QueueName: body.QueueName, tags: Tags });
};
