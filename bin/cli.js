#!/usr/bin/env node

'use strict';

const argv = require('minimist')(process.argv.slice(2));
const sqslite = require('../lib');

const DEFAULT_PORT = 4576;

if (argv.help) {
  return console.log(
    [
      '',
      'Usage: sqslite [--port <port>] [--path <path>] [options]',
      '',
      'A SQS http server',
      '',
      'Options:',
      '--help                 Display this help message and exit',
      '--port <port>          The port to listen on (default: 4567)',
      'Report bugs at github.com/jennyEckstein/sqslite/issues'
    ].join('\n')
  );
}

sqslite({}).listen(argv.port || DEFAULT_PORT, (err, address) => {
  if (err) throw err;
  console.log(`server listening on ${address}`);
});
