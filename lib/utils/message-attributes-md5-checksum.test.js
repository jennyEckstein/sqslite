'use strict';

const messageAttributesMD5Checksum = require('./message-attributes-md5-checksum');

describe('messageAttributesMD5Checksum', () => {
  test('calculate MD5 checksum with one message attribute', () => {
    expect(
      messageAttributesMD5Checksum({
        SellerName: { DataType: 'String', StringValue: 'Example Store' }
      })
    ).toEqual('cd28f3b68aeee4b2eac9c66f2f694b58');
  });

  test('calculate MD5 checksum with multiple message attributes', () => {
    expect(
      messageAttributesMD5Checksum({
        City: { DataType: 'String', StringValue: 'Any City' },
        PostalCode: { DataType: 'String', StringValue: '99065' },
        Region: { DataType: 'String', StringValue: 'WA' },
        SellerName: { DataType: 'String', StringValue: 'Example Store' }
      })
    ).toEqual('66d793da93becb551e41562575418975');
  });

  test('calculate MD5 checksum with message attributes consisting of type String and Number', () => {
    expect(
      messageAttributesMD5Checksum({
        City: { DataType: 'String', StringValue: 'Any City' },
        PostalCode: { DataType: 'String', StringValue: '99065' },
        PricePerGallon: { DataType: 'Number', StringValue: '1.99' },
        Region: { DataType: 'String', StringValue: 'WA' },
        SellerName: { DataType: 'String', StringValue: 'Example Store' }
      })
    ).toEqual('10809b55e3d9b22c17220b7dbaf283ef');
  });

  test('throw error when trying to calculate MD5 checksum of message attribute with data type Binary', () => {
    let err1;
    try {
      messageAttributesMD5Checksum({
        SellerName: { BinaryValue: Buffer.from('Example Store'), DataType: 'Binary' }
      });
    } catch (err) {
      err1 = err;
    }
    expect(err1.message).toEqual(
      'Not implemented: MessageAttributes with type Binary are not supported at the moment.'
    );
  });
});
