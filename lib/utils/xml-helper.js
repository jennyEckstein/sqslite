'use strict';

const builder = require('xmlbuilder');

module.exports.toXml = obj => {
  return builder.create(obj).end({ pretty: true });
};
