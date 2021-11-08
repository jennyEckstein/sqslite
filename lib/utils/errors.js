'use strict';

class ErrorWithCode extends Error {
  /**
   * @param {string} message - Error message.
   * @param {string} code - Error code.
   */
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

module.exports = { ErrorWithCode };
