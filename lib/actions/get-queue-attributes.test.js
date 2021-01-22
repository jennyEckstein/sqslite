'use strict';

const dedent = require('dedent');
const actionGetQueueAttributes = require('./get-queue-attributes');
const { getQueueAttributes } = require('../sqs');
const { ErrorWithCode } = require('../utils/errors');

jest.mock('../sqs');

const body = {
  Action: 'GetQueueAttributes',
  'AttributeName.1': 'All',
  QueueUrl: 'http://localhost:3001/queues/jenny-test'
};

describe('lib/actions/get-queue-attributes', () => {
  test('successfully return all parameters', () => {
    getQueueAttributes.mockImplementationOnce(() => {
      return {
        DelaySeconds: '11',
        FifoQueue: false,
        MaximumMessageSize: '111111',
        MessageRetentionPeriod: '21111',
        QueueArn: 'arn:aws:sqs:us-east-1:queues:jenny-test',
        ReceiveMessageWaitTimeSeconds: '11',
        RedrivePolicy: JSON.stringify({
          deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:jenny-test-dlq',
          maxReceiveCount: '1000'
        })
      };
    });
    expect(actionGetQueueAttributes(body)).toEqual(dedent`<?xml version="1.0"?>
    <GetQueueAttributesResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <GetQueueAttributesResult>
        <Attribute>
          <Name>DelaySeconds</Name>
          <Value>11</Value>
        </Attribute>
        <Attribute>
          <Name>FifoQueue</Name>
          <Value>false</Value>
        </Attribute>
        <Attribute>
          <Name>MaximumMessageSize</Name>
          <Value>111111</Value>
        </Attribute>
        <Attribute>
          <Name>MessageRetentionPeriod</Name>
          <Value>21111</Value>
        </Attribute>
        <Attribute>
          <Name>QueueArn</Name>
          <Value>arn:aws:sqs:us-east-1:queues:jenny-test</Value>
        </Attribute>
        <Attribute>
          <Name>ReceiveMessageWaitTimeSeconds</Name>
          <Value>11</Value>
        </Attribute>
        <Attribute>
          <Name>RedrivePolicy</Name>
          <Value>{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:queues:jenny-test-dlq","maxReceiveCount":"1000"}</Value>
        </Attribute>
      </GetQueueAttributesResult>
    </GetQueueAttributesResponse>`);
  });

  test('throw error when getQueueAttributes fails', () => {
    getQueueAttributes.mockImplementationOnce(() => {
      throw new ErrorWithCode('foo', 'bar');
    });
    let err1;
    try {
      actionGetQueueAttributes(body);
    } catch (err) {
      err1 = err;
    }
    expect(err1.message).toEqual('foo');
    expect(err1.xml).toEqual(dedent`
    <?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
        <Code>bar</Code>
        <Detail/>
        <Message>foo</Message>
        <Type>Sender</Type>
      </Error>
    </ErrorResponse>
    `);
  });
});
