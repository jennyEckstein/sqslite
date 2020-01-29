# Sqslite

An implementation of Amazon's SQS

### Example

```sh
$ sqslite --help

Usage: sqslite [options]
A SQS http server

Options:
--help Display this help message and exit
--port <port> The port to listen on (default: 4567)
  Report bugs at github.com/jennyEckstein/sqslite/issues
  ```

  Or programmatically:
  ```javascript
  const sqslite = require('sqslite');

  sqslite({}).listen(3001, (err, address) => {
  if (err) throw err;
  console.log(`server listening on ${address}`);
  });
  ```

  Once running, here's how to use AWS SDK to connect:

  ```javascript
  const AWS = require('aws-sdk');

  const sqs = new AWS.SQS({endpoint: 'http://localhost:3001'})
  await sqs.listQueues().promise();
  ```

  ### Installation
  With npm do:
  ```sh
  $ npm install -g sqslite
  ```

  ### Footnotes:
  At the moment only createQueue and listQueue are available.

  ### TODOs
  - Add tests for Policy attribute, when functionality implemented
  - when delete-queue functionality implemented, need to add check for QueueDeletedRecently error

  ### License

  [MIT](./LICENSE)