'use strict';

const { superstruct } = require('superstruct');

const struct = superstruct({
  types: {
    delayseconds: delaySeconds => {
      if (delaySeconds < 0 || delaySeconds > 900) {
        const err = `<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidAttributeValue</Code>
        <Message>Invalid value for the parameter DelaySeconds.</Message>
        <Detail/>
        </Error>
        <RequestId>bff16247-9ee2-50c4-be28-34083bcd2156</RequestId>
        </ErrorResponse>`;
        throw new Error(err);
      }
      return true;
    },
    kmsDataKeyReusePeriodSeconds: kmsDataKeyReusePeriodSeconds => {
      if (kmsDataKeyReusePeriodSeconds < 60 || kmsDataKeyReusePeriodSeconds > 86400) {
        throw new Error(`<?xml version="1.0"?>
          <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
          <Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeValue</Code>
          <Message>Invalid value for the parameter KmsDataKeyReusePeriodSeconds.</Message>
          <Detail/>
          </Error>
          <RequestId>351aa1b4-15dd-5021-bffa-f7fbb1e53940</RequestId>
          </ErrorResponse>`);
      }
      return true;
    },
    kmsMasterKeyId: () => {
      // TODO: looks like AWS allows any value, not just the ones that start with alias
      // if (!/^alias\/.*$/.test(kmsMasterKeyId)) {
      //   throw new Error('Error creating queue. KmsMasterKeyId must begin with "alias/"');
      // }
      return true;
    },
    maximummessagesize: maximumMessageSize => {
      if (maximumMessageSize < 1024 || maximumMessageSize > 262144) {
        throw new Error(
          `<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
          <Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeValue</Code>
          <Message>Invalid value for the parameter MaximumMessageSize.</Message>
          <Detail/>
          </Error><RequestId>889b0154-15cf-56c7-9dc2-571bb7b52432</RequestId>
          </ErrorResponse>`
        );
      }
      return true;
    },
    messageRetentionPeriod: messageRetentionPeriod => {
      if (messageRetentionPeriod < 60 || messageRetentionPeriod > 1209600) {
        throw new Error(`<?xml version="1.0"?>
          <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
          <Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeName</Code>
          <Message>Unknown Attribute messageRetentionPeriod.</Message>
          <Detail/>
          </Error><RequestId>c69e516b-46d2-5759-af28-0724e6d14879</RequestId></ErrorResponse>`);
      }
      return true;
    },
    queuename: queueName => {
      if (queueName.length > 80) {
        throw new Error(`<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidParameterValue</Code>
        <Message>Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length</Message>
        <Detail/>
        </Error>
        <RequestId>7037a5d2-1c56-560b-ade9-f39da7c17e11</RequestId></ErrorResponse>`);
      }

      if (!/^[a-zA-Z0-9-_]*\.fifo$|^[a-zA-Z0-9-_]*$/.test(queueName)) {
        throw new Error(`<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidParameterValue</Code>
        <Message>Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length</Message>
        <Detail/>
        </Error>
        <RequestId>88de9360-9353-5788-acf0-c52f2d25d0f0</RequestId></ErrorResponse>`);
      }
      return true;
    },
    receiveMessageWaitTimeSeconds: receiveMessageWaitTimeSeconds => {
      if (receiveMessageWaitTimeSeconds < 0 || receiveMessageWaitTimeSeconds > 20) {
        throw new Error(`<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
          <Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeName</Code>
          <Message>Unknown Attribute receiveMessageWaitTimeSeconds.</Message>
          <Detail/>
          </Error>
          <RequestId>b78db8c9-5bdf-5c9b-97ad-ee86c7c82227</RequestId></ErrorResponse>`);
      }
      return true;
    },
    redrivePolicy: redrivePolicy => {
      if (!redrivePolicy) return true;
      if (redrivePolicy && !redrivePolicy.deadLetterQueueArn) {
        throw new Error('Error creating queue. Redrive policy missing deadLetterQueueArn');
      }

      if (redrivePolicy && !redrivePolicy.maxReceiveCount) {
        throw new Error('Error creating queue. Redrive policy missing maxReceiveCount');
      }

      return true;
    },
    visibilityTimeout: visibilityTimeout => {
      if (visibilityTimeout < 0 || visibilityTimeout > 43200) {
        throw new Error(`<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
          <Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeValue</Code>
          <Message>Invalid value for the parameter VisibilityTimeout.</Message>
          <Detail/>
          </Error>
          <RequestId>3a5aa982-6d39-50d6-8d21-ffcdf602b900</RequestId></ErrorResponse>`);
      }
      return true;
    }
  }
});

const Queue = struct({
  Attributes: struct(
    {
      ContentBasedDeduplication: 'boolean',
      DelaySeconds: 'delayseconds',
      FifoQueue: 'boolean',
      KmsDataKeyReusePeriodSeconds: 'kmsDataKeyReusePeriodSeconds',
      KmsMasterKeyId: 'kmsMasterKeyId',
      MaximumMessageSize: 'maximummessagesize',
      MessageRetentionPeriod: 'messageRetentionPeriod',
      ReceiveMessageWaitTimeSeconds: 'receiveMessageWaitTimeSeconds',
      RedrivePolicy: 'redrivePolicy',
      VisibilityTimeout: 'visibilityTimeout?'
    },
    {
      ContentBasedDeduplication: false, // TODO: verify correct default value
      DelaySeconds: 0,
      FifoQueue: false,
      KmsDataKeyReusePeriodSeconds: 300,
      KmsMasterKeyId: 'alias/aws/sqs',
      MaximumMessageSize: 262144,
      MessageRetentionPeriod: 345600,
      ReceiveMessageWaitTimeSeconds: 0,
      VisibilityTimeout: 30
    }
  ),
  QueueName: 'queuename',
  tags: 'object?'
});

module.exports = {
  Queue
};
