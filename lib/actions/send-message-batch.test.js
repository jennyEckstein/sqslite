'use strict';

const dedent = require('dedent');

const { sendMessageBatch } = require('../sqs');
const actionSendMessageBatch = require('./send-message-batch');
const { ErrorWithCode } = require('../utils/errors');
const samples = require('./samples/send-message-batch.test.json');

jest.mock('../sqs');

describe('actions/send-message', () => {
  beforeEach(() => jest.resetAllMocks());

  test('no message attributes', () => {
    sendMessageBatch.mockImplementationOnce(() => ({
      MD5OfMessageBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
      MessageId: '3be721ed-22bd-4871-a764-b42c47ac9f7a'
    }));
    expect(actionSendMessageBatch(samples.noAttributesBody)).toEqual(
      samples.noAttributesResponseXMLString
    );
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
    expect(actionSendMessageBatch(samples.attributesBody)).toEqual(
      samples.attributesResponseXMLString
    );
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
