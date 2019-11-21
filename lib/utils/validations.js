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
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
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
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
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
          </Error><RequestId>00000000-0000-0000-0000-000000000000</RequestId>
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
          </Error><RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`);
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
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`);
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
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`);
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
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`);
      }
      return true;
    },
    redrivePolicy: redrivePolicy => {
      if (!redrivePolicy) return true;
      if (redrivePolicy && !redrivePolicy.deadLetterQueueArn) {
        throw new Error(`<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidParameterValue</Code>
        <Message>Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.</Message>
        <Detail/></Error><RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ErrorResponse>`);
      }

      if (redrivePolicy && !redrivePolicy.maxReceiveCount) {
        throw new Error(`<?xml version="1.0"?>
        <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <Error>
        <Type>Sender</Type>
        <Code>InvalidParameterValue</Code>
        <Message>Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.</Message>
        <Detail/>
        </Error>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ErrorResponse>`);
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
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId></ErrorResponse>`);
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
