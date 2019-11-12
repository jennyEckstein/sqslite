'use strict';

const index = require('.');
const sqs = require('./sqs');

describe('index', () => {
  test('export all required functions', () => {
    expect(index).toEqual(sqs);
  });
});
