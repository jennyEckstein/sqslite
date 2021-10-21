'use strict';

const { SendMessageParams, sendMessage } = require('../sqs');
const { toXml, toXmlError } = require('../utils/xml-helper');
const { ErrorWithCode } = require('../utils/errors');

const MESSAGE_SYSTEM_ATTRIBUTE_1_NAME = 'MessageSystemAttribute.1.Name';

/**
 * Sends a message to the queue.
 *
 * @param {Object.<string, any>} body - Request body.
 * @returns {string} XMLSendMessageResponse.
 * @throws InvalidParameterValue, thrown when number of attributes exceed the maximum (10).
 * @throws InvalidParameterValue, thrown when an attribute's name is invalid.
 * @throws XMLErrors, based on sendMessage's errors.
 */
module.exports = (body) => {
  /** @type {SendMessageParams} */
  const params = {
    DelaySeconds: body.DelaySeconds,
    MessageBody: body.MessageBody,
    MessageGroupId: body.MessageGroupId,
    QueueUrl: body.QueueUrl
  };

  const objs = Object.keys(body).filter(
    (key) => key.startsWith('MessageAttribute') && /MessageAttribute\.(\d{2}|\d)\.Name/.exec(key)
  );

  if (objs.length > 10) {
    throw new ErrorWithCode(
      'Number of message attributes [12] exceeds the allowed maximum [10].',
      'InvalidParameterValue'
    );
  }

  // eslint-disable-next-line unicorn/prefer-object-from-entries
  const messageAttributes = objs.reduce(
    /**
     * @param {Object.<string, any>} acc - Accumulator.
     * @param {*} obj - Object.
     * @param {number} index - Index.
     * @returns {Object.<string, any>}
     */
    (acc, obj, index) => {
      const i = index + 1; // Starts at 1
      acc[body[`MessageAttribute.${i}.Name`]] = {
        DataType: body[`MessageAttribute.${i}.Value.DataType`]
      };

      if (body[`MessageAttribute.${i}.Value.StringValue`]) {
        acc[body[`MessageAttribute.${i}.Name`]].StringValue =
          body[`MessageAttribute.${i}.Value.StringValue`];
      }

      if (body[`MessageAttribute.${i}.Value.BinaryValue`]) {
        acc[body[`MessageAttribute.${i}.Name`]].BinaryValue =
          body[`MessageAttribute.${i}.Value.BinaryValue`];
      }

      return acc;
    },
    {}
  );

  if (Object.keys(messageAttributes).length > 0) {
    params.MessageAttributes = messageAttributes;
  }

  /** @type {Object.<string, any>} */
  const messageSystemAttributes = {};

  if (
    body[MESSAGE_SYSTEM_ATTRIBUTE_1_NAME] &&
    body[MESSAGE_SYSTEM_ATTRIBUTE_1_NAME] !== 'AWSTraceHeader'
  ) {
    throw new ErrorWithCode(
      `Message system attribute name ${body[MESSAGE_SYSTEM_ATTRIBUTE_1_NAME]} is invalid.`,
      'InvalidParameterValue'
    );
  } else if (body[MESSAGE_SYSTEM_ATTRIBUTE_1_NAME] === 'AWSTraceHeader') {
    messageSystemAttributes.AWSTraceHeader = {
      DataType: body['MessageSystemAttribute.1.Value.DataType']
    };
    if (body['MessageSystemAttribute.1.Value.StringValue']) {
      messageSystemAttributes.AWSTraceHeader = {
        ...messageSystemAttributes.AWSTraceHeader,
        StringValue: body['MessageSystemAttribute.1.Value.StringValue']
      };
    }
    if (body['MessageSystemAttribute.1.Value.BinaryValue']) {
      messageSystemAttributes.AWSTraceHeader = {
        ...messageSystemAttributes.AWSTraceHeader,
        StringValue: body['MessageSystemAttribute.1.Value.BinaryValue']
      };
    }
  }

  if (Object.keys(messageSystemAttributes).length > 0) {
    params.MessageSystemAttributes = messageSystemAttributes;
  }

  try {
    const {
      MD5OfMessageAttributes,
      MD5OfMessageBody,
      MD5OfMessageSystemAttributes,
      MessageId,
      SequenceNumber
    } = sendMessage(params);

    return toXml('SendMessageResponse', {
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      },
      SendMessageResult: {
        MD5OfMessageAttributes,
        MD5OfMessageBody,
        MD5OfMessageSystemAttributes,
        MessageId,
        SequenceNumber
      }
    });
  } catch (err) {
    throw toXmlError(err);
  }
};
