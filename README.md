# SQSLite

![Codecov](https://img.shields.io/codecov/c/github/lifion/sqslite)

An implementation of Amazon's Simple Queue Service (SQS). This project aims to imitate live SQS as close as possible.

## What about Localstack?

Localstack was an inspiration for this project. We used Localstack for our SQS needs before this project was started. We chose to create this implementation for the following reasons:

- **Decoupled from Localstack.** Localstack runs many AWS service imitations and therefore builky for local development. Our goal is to have a lightweight implementation.
- **Native JavaScript module.** This module can be used as Command Line Interface (CLI) application or as an npm module.

---

## Example

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

const sqs = new AWS.SQS({ endpoint: 'http://localhost:3001' });
await sqs.listQueues().promise();
```

---

## Installation

With npm do:

```sh
npm install -g sqslite
```

Or to install for development/testing in your project:

```sh
npm install -D sqslite
```

---

## Supported Functions

- ChangeMessageVisibility
- CreateQueue
- DeleteMessage
- DeleteMessageBatch
- DeleteQueue
- GetQueueAttributes
- GetQueueUrl
- ListDeadLetterSourceQueues
- ListQueueTags
- ListQueues
- PurgeQueue
- ReceiveMessage
- SendMessage
- SendMessageBatch
- SetQueueAttributes
- TagQueue
- UntagQueue

---

### Media

[Introducing SQSLite](https://eng.lifion.com/introducing-sqslite-9d5d9554a34b)

### License

[MIT](./LICENSE)
