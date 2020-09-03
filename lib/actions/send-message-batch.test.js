'use strict';

const dedent = require('dedent');
const { sendMessageBatch } = require('../sqs');
const actionSendMessageBatch = require('./send-message-batch');
const { ErrorWithCode } = require('../utils/errors');

jest.mock('../sqs');

describe('actions/send-message', () => {
  beforeEach(() => jest.resetAllMocks());

  test('no message attributes', () => {
    sendMessageBatch.mockImplementationOnce(() => ({
      MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
      MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a'
    }));
    const input = {
      Action: 'SendMessageBatch',
      QueueUrl: 'http://localhost:3000/queues/jenny-test',
      'SendMessageBatchRequestEntry.1.DelaySeconds': '10',
      'SendMessageBatchRequestEntry.1.Id': 'FuelReport-0001-2015-09-16T140731Z',
      'SendMessageBatchRequestEntry.1.MessageBody':
        'Fuel report for account 0001 on 2015-09-16 at 02:07:31 PM.',
      'SendMessageBatchRequestEntry.2.DelaySeconds': '10',
      'SendMessageBatchRequestEntry.2.Id': 'FuelReport-0002-2015-09-16T140930Z',
      'SendMessageBatchRequestEntry.2.MessageBody':
        'Fuel report for account 0002 on 2015-09-16 at 02:09:30 PM.',
      Version: '2012-11-05'
    };
    expect(actionSendMessageBatch(input)).toEqual(`<?xml version="1.0"?>
<SendMessageBatchResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
  <ResponseMetadata>
    <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
  </ResponseMetadata>
  <SendMessageBatchResult>
    <SendMessageBatchResultEntry>
      <MD5OfMessageBody>acbd18db4cc2f85cedef654fccc4a4d8</MD5OfMessageBody>
      <MessageId>3be721ed-22bd-4871-a764-b42c47ac9f7a</MessageId>
    </SendMessageBatchResultEntry>
  </SendMessageBatchResult>
</SendMessageBatchResponse>`);
    expect(sendMessageBatch).toHaveBeenCalledTimes(1);
    expect(sendMessageBatch).toHaveBeenNthCalledWith(1, {
      QueueUrl: 'http://localhost:3000/queues/jenny-test',
      messages: [
        {
          DelaySeconds: '10',
          Id: 'FuelReport-0001-2015-09-16T140731Z',
          MessageBody: 'Fuel report for account 0001 on 2015-09-16 at 02:07:31 PM.'
        },
        {
          DelaySeconds: '10',
          Id: 'FuelReport-0002-2015-09-16T140930Z',
          MessageBody: 'Fuel report for account 0002 on 2015-09-16 at 02:09:30 PM.'
        }
      ]
    });
  });

  test('return sent message', () => {
    sendMessageBatch.mockImplementationOnce(() => ({
      MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
      MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a'
    }));
    const input = {
      Action: 'SendMessageBatch',
      QueueUrl: 'http://localhost:3000/queues/jenny-test',
      'SendMessageBatchRequestEntry.1.DelaySeconds': '10',
      'SendMessageBatchRequestEntry.1.Id': 'FuelReport-0001-2015-09-16T140731Z',
      'SendMessageBatchRequestEntry.1.MessageAttribute.1.Name': 'SellerName',
      'SendMessageBatchRequestEntry.1.MessageAttribute.1.Value.BinaryValue': 'Example Store',
      'SendMessageBatchRequestEntry.1.MessageAttribute.1.Value.DataType': 'Binary',
      'SendMessageBatchRequestEntry.1.MessageAttribute.2.Name': 'City',
      'SendMessageBatchRequestEntry.1.MessageAttribute.2.Value.DataType': 'String',
      'SendMessageBatchRequestEntry.1.MessageAttribute.2.Value.StringValue': 'Any City',
      'SendMessageBatchRequestEntry.1.MessageAttribute.3.Name': 'Region',
      'SendMessageBatchRequestEntry.1.MessageAttribute.3.Value.DataType': 'String',
      'SendMessageBatchRequestEntry.1.MessageAttribute.3.Value.StringValue': 'WA',
      'SendMessageBatchRequestEntry.1.MessageAttribute.4.Name': 'PostalCode',
      'SendMessageBatchRequestEntry.1.MessageAttribute.4.Value.DataType': 'String',
      'SendMessageBatchRequestEntry.1.MessageAttribute.4.Value.StringValue': '99065',
      'SendMessageBatchRequestEntry.1.MessageAttribute.5.Name': 'PricePerGallon',
      'SendMessageBatchRequestEntry.1.MessageAttribute.5.Value.DataType': 'Number',
      'SendMessageBatchRequestEntry.1.MessageAttribute.5.Value.StringValue': '1.99',
      'SendMessageBatchRequestEntry.1.MessageBody':
        'Fuel report for account 0001 on 2015-09-16 at 02:07:31 PM.',
      'SendMessageBatchRequestEntry.2.DelaySeconds': '10',
      'SendMessageBatchRequestEntry.2.Id': 'FuelReport-0002-2015-09-16T140930Z',
      'SendMessageBatchRequestEntry.2.MessageAttribute.1.Name': 'SellerName',
      'SendMessageBatchRequestEntry.2.MessageAttribute.1.Value.DataType': 'String',
      'SendMessageBatchRequestEntry.2.MessageAttribute.1.Value.StringValue': 'Example Fuels',
      'SendMessageBatchRequestEntry.2.MessageAttribute.2.Name': 'City',
      'SendMessageBatchRequestEntry.2.MessageAttribute.2.Value.DataType': 'String',
      'SendMessageBatchRequestEntry.2.MessageAttribute.2.Value.StringValue': 'North Town',
      'SendMessageBatchRequestEntry.2.MessageAttribute.3.Name': 'Region',
      'SendMessageBatchRequestEntry.2.MessageAttribute.3.Value.DataType': 'String',
      'SendMessageBatchRequestEntry.2.MessageAttribute.3.Value.StringValue': 'WA',
      'SendMessageBatchRequestEntry.2.MessageAttribute.4.Name': 'PostalCode',
      'SendMessageBatchRequestEntry.2.MessageAttribute.4.Value.DataType': 'String',
      'SendMessageBatchRequestEntry.2.MessageAttribute.4.Value.StringValue': '99123',
      'SendMessageBatchRequestEntry.2.MessageAttribute.5.Name': 'PricePerGallon',
      'SendMessageBatchRequestEntry.2.MessageAttribute.5.Value.DataType': 'Number',
      'SendMessageBatchRequestEntry.2.MessageAttribute.5.Value.StringValue': '1.87',
      'SendMessageBatchRequestEntry.2.MessageBody':
        'Fuel report for account 0002 on 2015-09-16 at 02:09:30 PM.',

      Version: '2012-11-05'
    };
    expect(actionSendMessageBatch(input)).toEqual(`<?xml version="1.0"?>
<SendMessageBatchResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
  <ResponseMetadata>
    <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
  </ResponseMetadata>
  <SendMessageBatchResult>
    <SendMessageBatchResultEntry>
      <MD5OfMessageBody>acbd18db4cc2f85cedef654fccc4a4d8</MD5OfMessageBody>
      <MessageId>3be721ed-22bd-4871-a764-b42c47ac9f7a</MessageId>
    </SendMessageBatchResultEntry>
  </SendMessageBatchResult>
</SendMessageBatchResponse>`);
    expect(sendMessageBatch).toHaveBeenCalledTimes(1);
    expect(sendMessageBatch).toHaveBeenNthCalledWith(1, {
      QueueUrl: 'http://localhost:3000/queues/jenny-test',
      messages: [
        {
          DelaySeconds: '10',
          Id: 'FuelReport-0001-2015-09-16T140731Z',
          MessageAttributes: {
            City: {
              DataType: 'String',
              StringValue: 'Any City'
            },
            PostalCode: {
              DataType: 'String',
              StringValue: '99065'
            },
            PricePerGallon: {
              DataType: 'Number',
              StringValue: '1.99'
            },
            Region: {
              DataType: 'String',
              StringValue: 'WA'
            },
            SellerName: {
              BinaryValue: 'Example Store',
              DataType: 'Binary'
            }
          },
          MessageBody: 'Fuel report for account 0001 on 2015-09-16 at 02:07:31 PM.'
        },
        {
          DelaySeconds: '10',
          Id: 'FuelReport-0002-2015-09-16T140930Z',
          MessageAttributes: {
            City: {
              DataType: 'String',
              StringValue: 'North Town'
            },
            PostalCode: {
              DataType: 'String',
              StringValue: '99123'
            },
            PricePerGallon: {
              DataType: 'Number',
              StringValue: '1.87'
            },
            Region: {
              DataType: 'String',
              StringValue: 'WA'
            },
            SellerName: {
              DataType: 'String',
              StringValue: 'Example Fuels'
            }
          },
          MessageBody: 'Fuel report for account 0002 on 2015-09-16 at 02:09:30 PM.'
        }
      ]
    });
  });

  test('throw error when send message failed', () => {
    sendMessageBatch.mockImplementationOnce(() => {
      throw new ErrorWithCode('foo', 'bar');
    });

    let error;
    try {
      actionSendMessageBatch({
        Action: 'SendMessageBatch',
        MessageBody: 'foo',
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test',
        Version: '2012-11-05'
      });
    } catch (err) {
      error = err;
    }
    expect(error.message).toEqual('foo');
    expect(error.xml).toEqual(dedent`<?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
        <Code>bar</Code>
        <Detail/>
        <Message>foo</Message>
        <Type>Sender</Type>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>`);
    expect(sendMessageBatch).toHaveBeenCalledTimes(1);
    expect(sendMessageBatch).toHaveBeenNthCalledWith(1, {
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/144505630525/jenny-test',
      messages: []
    });
  });
});
