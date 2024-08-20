/* eslint-disable no-underscore-dangle */
import { CURRENT_FORM_CONTEXT } from '../../common/constants.js';
import { FD_ENDPOINTS } from './constant.js';
import { fetchJsonResponse } from '../../common/makeRestAPI.js';
import { urlPath } from '../../common/formutils.js';

const SELECTED_CUSTOMER_ID = {};

const custmerIdPayload = (mobileNumber, panNumber, dateOfBirth) => {
  const payload = {
    requestString: {
      mobileNumber,
      dateOfBirth: dateOfBirth || '',
      panNumber: panNumber ? panNumber.replace(/\s+/g, '') : '',
      journeyID: CURRENT_FORM_CONTEXT.journeyID,
      journeyName: CURRENT_FORM_CONTEXT.journeyName,
    },
  };
  return payload;
};

/**
 * Fetches the customer ID
 *
 * @param {string} mobileNumber
 * @param {string} pan
 * @param {string} dob
 * @param {Object} globals
 * @returns {Promise<Object>} A promise that resolves to the JSON response of the customer account details.
 */
const fetchCustomerId = (mobileNumber, pan, dob, globals) => {
  const payload = custmerIdPayload(mobileNumber, pan, dob, globals);
  return fetchJsonResponse(urlPath(FD_ENDPOINTS.customeraccountdetailsdto), payload, 'POST');
};

const updateData = (globals, customerData, panel) => {
  globals.functions.setProperty(panel.maskedAccNo, { value: customerData.customerId });
  globals.functions.setProperty(panel.noofFDs, { value: customerData.eligibleFDCount });
};

const customerIdSuccessHandler = (payload, globals) => {
  const customerData = payload?.customerDetailsDTO;
  if (!customerData?.length) return;

  CURRENT_FORM_CONTEXT.customerInfo = payload;

  const panel = globals.form.multipleCustIDPanel.multipleCustIDSelectionPanel.multipleCustIDRepeatable;

  customerData.forEach((custItem, i) => {
    if (i < customerData.length - 1) {
      globals.functions.dispatchEvent(panel, 'addItem');
    }
    setTimeout(() => {
      updateData(globals, custItem, panel[i]);
    }, i * 40);
  });
};

/**
 * Handles on select of customer ID radio button.
 * @name customerIdClickHandler
 * @param {Object} customerIds
 */
const customerIdClickHandler = (customerIds) => {
  const selectedCustIdPanel = customerIds.filter((item) => item.multipleCustIDSelect._data.$_value === 'on');
  if (selectedCustIdPanel) {
    const selectedCustId = selectedCustIdPanel[0].maskedAccNo._data.$_value;
    SELECTED_CUSTOMER_ID.selectedCustId = CURRENT_FORM_CONTEXT.customerInfo.customerDetailsDTO.filter((item) => item.customerId === selectedCustId)?.[0];
  }
};

export {
  fetchCustomerId,
  customerIdSuccessHandler,
  customerIdClickHandler,
  SELECTED_CUSTOMER_ID,
};