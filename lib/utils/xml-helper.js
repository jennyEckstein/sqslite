'use strict';

const builder = require('xmlbuilder');

function toXml(rootName, obj) {
  // TODO: add validations for rootName and obj
  return builder
    .create({
      [rootName]: {
        '@xmlns': 'http://queue.amazonaws.com/doc/2012-11-05/',
        ...obj
      }
    })
    .end({ pretty: true });
}

function toXmlError(error) {
  const xml = toXml('ErrorResponse', {
    Error: {
      Code: error.code,
      Detail: {},
      Message: error.message,
      Type: 'Sender'
    }
  });
  return Object.assign(error, { xml });
}

module.exports = { toXml, toXmlError };
