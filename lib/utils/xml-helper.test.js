'use strict';

const dedent = require('dedent');

const { toXml, toXmlError } = require('./xml-helper');

test('return object in xml format', () => {
  expect(toXml('TestRootName', { foo: 'bar' })).toEqual(dedent`
    <?xml version="1.0"?>
    <TestRootName xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <foo>bar</foo>
    </TestRootName>
  `);
});

test('return object in xml error format', () => {
  const err = new Error('Some Error');
  const result = toXmlError(err);
  expect(result).toEqual(expect.any(Error));
  expect(result.message).toEqual('Some Error');
  expect(result.xml).toEqual(dedent`
    <?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
        <Detail/>
        <Message>Some Error</Message>
        <Type>Sender</Type>
      </Error>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ErrorResponse>
  `);
});
