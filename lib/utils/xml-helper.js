'use strict';

const condNextLine = ([startTag, endTag], value) => {
  if (value === undefined) return '';
  return [startTag, value, endTag].join('');
};

module.exports = { condNextLine };
