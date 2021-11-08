'use strict';

const md5 = require('md5');

const SIZE_LENGTH = 4;
const TRANSPORT_FOR_TYPE_STRING_OR_NUMBER = 1;
const transportType1 = new Set(['String', 'Number']);

/**
 * Creates hash for message attributes.
 *
 * @param {Object.<string, any>} messageAttributes - Message Attributes.
 * @returns {string} MD5 hash of messageAttributes.
 * @throws {Error} Throws error when binary value is detected, currently not supported.
 */
module.exports = (messageAttributes) => {
  const buffers = [];
  const keys = Object.keys(messageAttributes).sort();
  for (const key of keys) {
    const { DataType, StringValue } = messageAttributes[key];

    const nameSize = Buffer.alloc(SIZE_LENGTH);
    nameSize.writeUInt32BE(key.length);

    const name = Buffer.alloc(key.length);
    name.write(key);

    const typeSize = Buffer.alloc(SIZE_LENGTH);
    typeSize.writeUInt32BE(DataType.length);

    const type = Buffer.alloc(DataType.length);
    type.write(DataType);

    const transport = Buffer.alloc(1);

    let valueSize;
    let value;
    if (transportType1.has(DataType)) {
      transport.writeUInt8(TRANSPORT_FOR_TYPE_STRING_OR_NUMBER);
      valueSize = Buffer.alloc(SIZE_LENGTH);
      valueSize.writeUInt32BE(StringValue.length);

      value = Buffer.alloc(StringValue.length);
      value.write(StringValue);
    } else {
      throw new Error(
        'Not implemented: MessageAttributes with type Binary are not supported at the moment.'
      );
    }

    const buffer = Buffer.concat([nameSize, name, typeSize, type, transport, valueSize, value]);

    buffers.push(buffer);
  }

  return md5(Buffer.concat(buffers));
};
