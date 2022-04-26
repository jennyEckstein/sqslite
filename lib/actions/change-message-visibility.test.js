'use strict';

const dedent = require('dedent');

const { changeMessageVisibility } = require('../sqs');
const actionChangeMessageVisibility = require('./change-message-visibility');
const { ErrorWithCode } = require('../utils/errors');

jest.mock('../sqs');

describe('actions/change-message-visibility', () => {
  beforeEach(() => jest.resetAllMocks());

  test('successfully change message visibility', () => {
    expect(
      actionChangeMessageVisibility({
        QueueUrl: 'http://localhost:3000/queues/core-test',
        ReceiptHandle: '1000001',
        VisibilityTimeout: 25
      })
    ).toEqual(dedent`
      <?xml version="1.0"?>
      <ChangeMessageVisibilityResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
        <ResponseMetadata>
          <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ResponseMetadata>
      </ChangeMessageVisibilityResponse>
    `);
  });

  test('throw error when changeMessageVisibility throws error', () => {
    changeMessageVisibility.mockImplementationOnce(() => {
      throw new ErrorWithCode('foo', 'bar');
    });

    let err1;
    try {
      actionChangeMessageVisibility({
        QueueUrl: 'http://localhost:3000/queues/core-test',
        ReceiptHandle: '1000001',
        VisibilityTimeout: 25
      });
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
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ErrorResponse>
    `);

    expect(changeMessageVisibility).toHaveBeenCalledTimes(1);
    expect(changeMessageVisibility).toHaveBeenNthCalledWith(1, {
      QueueUrl: 'http://localhost:3000/queues/core-test',
      ReceiptHandle: '1000001',
      VisibilityTimeout: 25
    });
  });
});
