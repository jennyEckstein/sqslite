'use strict';

const { superstruct } = require('superstruct');

const struct = superstruct({
  types: {
    delaySeconds: delaySeconds => {
      if (delaySeconds < 0 || delaySeconds > 900) {
        const err = new Error('Invalid value for the parameter DelaySeconds.');
        const xml = `<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidAttributeValue</Code>
        <Message>Invalid value for the parameter DelaySeconds.</Message>
        <Detail/>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ErrorResponse>`;
        throw Object.assign(err, { xml });
      }
      return true;
    },
    kmsDataKeyReusePeriodSeconds: kmsDataKeyReusePeriodSeconds => {
      if (kmsDataKeyReusePeriodSeconds < 60 || kmsDataKeyReusePeriodSeconds > 86400) {
        const err = new Error('Invalid value for the parameter KmsDataKeyReusePeriodSeconds.');
        const xml = `<?xml version="1.0"?>
          <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
          <Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeValue</Code>
          <Message>Invalid value for the parameter KmsDataKeyReusePeriodSeconds.</Message>
          <Detail/>
          </Error>
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
          </ErrorResponse>`;
        throw Object.assign(err, { xml });
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
    maximumMessageSize: maximumMessageSize => {
      if (maximumMessageSize < 1024 || maximumMessageSize > 262144) {
        const err = new Error('Invalid value for the parameter MaximumMessageSize.');
        const xml = `<?xml version="1.0"?><ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
          <Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeValue</Code>
          <Message>Invalid value for the parameter MaximumMessageSize.</Message>
          <Detail/>
          </Error><RequestId>00000000-0000-0000-0000-000000000000</RequestId>
          </ErrorResponse>`;
        throw Object.assign(err, { xml });
      }
      return true;
    },
    messageRetentionPeriod: messageRetentionPeriod => {
      if (messageRetentionPeriod < 60 || messageRetentionPeriod > 1209600) {
        const err = new Error('Invalid value for the parameter MessageRetentionPeriod.');
        const xml = `<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidAttributeValue</Code>
        <Message>Invalid value for the parameter MessageRetentionPeriod.</Message>
        <Detail/>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ErrorResponse>`;
        throw Object.assign(err, { xml });
      }
      return true;
    },
    queueName: queueName => {
      if (queueName.length > 80) {
        const err = new Error(
          'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
        );
        const xml = `<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidParameterValue</Code>
        <Message>Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length</Message>
        <Detail/>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;
        throw Object.assign(err, { xml });
      }

      if (!/^[a-zA-Z0-9-_]*\.fifo$|^[a-zA-Z0-9-_]*$/.test(queueName)) {
        const err = new Error(
          'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
        );
        const xml = `<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidParameterValue</Code>
        <Message>Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length</Message>
        <Detail/>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;
        throw Object.assign(err, { xml });
      }
      return true;
    },
    receiveMessageWaitTimeSeconds: receiveMessageWaitTimeSeconds => {
      if (receiveMessageWaitTimeSeconds < 0 || receiveMessageWaitTimeSeconds > 20) {
        const err = new Error('Invalid value for the parameter ReceiveMessageWaitTimeSeconds.');
        const xml = `<?xml version="1.0"?>
          <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/"><Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeValue</Code>
          <Message>Invalid value for the parameter ReceiveMessageWaitTimeSeconds.</Message>
          <Detail/>
          </Error>
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
          </ErrorResponse>`;
        throw Object.assign(err, { xml });
      }
      return true;
    },
    redrivePolicy: redrivePolicy => {
      if (!redrivePolicy) return true;

      if (redrivePolicy && !redrivePolicy.deadLetterTargetArn) {
        const err = new Error(
          'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
        );
        const xml = `<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidParameterValue</Code>
        <Message>Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.</Message>
        <Detail/></Error><RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ErrorResponse>`;
        throw Object.assign(err, { xml });
      }

      if (redrivePolicy && !redrivePolicy.maxReceiveCount) {
        const err = new Error(
          'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.'
        );
        const xml = `<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidParameterValue</Code>
        <Message>Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.</Message>
        <Detail/>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ErrorResponse>`;
        throw Object.assign(err, { xml });
      }

      return true;
    },
    visibilityTimeout: visibilityTimeout => {
      if (visibilityTimeout < 0 || visibilityTimeout > 43200) {
        const err = new Error('Invalid value for the parameter VisibilityTimeout.');
        const xml = `<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
          <Error>
          <Type>Sender</Type>
          <Code>InvalidAttributeValue</Code>
          <Message>Invalid value for the parameter VisibilityTimeout.</Message>
          <Detail/>
          </Error>
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`;
        throw Object.assign(err, { xml });
      }
      return true;
    }
  }
});

const Queue = struct({
  Attributes: struct(
    {
      ContentBasedDeduplication: 'boolean',
      DelaySeconds: 'delaySeconds',
      FifoQueue: 'boolean',
      KmsDataKeyReusePeriodSeconds: 'kmsDataKeyReusePeriodSeconds',
      KmsMasterKeyId: 'kmsMasterKeyId',
      MaximumMessageSize: 'maximumMessageSize',
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
  QueueName: 'queueName',
  tags: 'object?'
});

module.exports = {
  Queue
};
