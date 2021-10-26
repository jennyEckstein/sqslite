'use strict';

const dedent = require('dedent');

const actionSetQueueAttributes = require('./set-queue-attributes');
const { setQueueAttributes } = require('../sqs');
const { ErrorWithCode } = require('../utils/errors');
const samples = require('./samples/set-queue-attributes.test.json');

jest.mock('../sqs');

describe('lib/actions/set-queue-attributes', () => {
  test('successfully set attributes', () => {
    expect(actionSetQueueAttributes(samples.baseBody)).toEqual(dedent`
    <?xml version="1.0"?>
    <SetQueueAttributesResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </SetQueueAttributesResponse>`);
  });

  test('throws error', () => {
    setQueueAttributes.mockImplementationOnce(() => {
      throw new ErrorWithCode('Mock Error', 'Mock Error');
    });
    let err1;
    try {
      actionSetQueueAttributes(samples.baseBody);
    } catch (err) {
      err1 = err;
    }
    expect(err1.message).toEqual('Mock Error');
    expect(err1.xml).toEqual(dedent`
    <?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
        <Code>Mock Error</Code>
        <Detail/>
        <Message>Mock Error</Message>
        <Type>Sender</Type>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>`);
  });
});
