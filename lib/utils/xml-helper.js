'use strict';

const builder = require('xmlbuilder');

/**
 * Converts object to xml format.
 *
 * @param {string} rootName - The name of the object.
 * @param {*} obj - The object to convert.
 * @returns {string} XMLString
 */
function toXml(rootName, obj) {
  return builder
    .create({
      [rootName]: {
        '@xmlns': 'http://queue.amazonaws.com/doc/2012-11-05/',
        ...obj
      }
    })
    .end({ pretty: true });
}

/**
 * Converts error object with a code to xml format.
 *
 * @param {*} error - The error object.
 * @returns {Object} ErrorResponse
 */
function toXmlError(error) {
  const xml = toXml('ErrorResponse', {
    Error: {
      Code: error.code,
      Detail: {},
      Message: error.message,
      Type: 'Sender'
    },
    RequestId: '00000000-0000-0000-0000-000000000000'
  });
  return Object.assign(error, { xml });
}

module.exports = { toXml, toXmlError };
