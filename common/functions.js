import {
  OTPVAL,
  RESENDOTP,
  getThisCard,
  prefillForm,
  createPanValidationRequest,
  getAddressDetails,
  pinCodeMaster,
  validateEmailID,
  currentAddressToggleHandler,
  currentFormContext,
} from '../creditcards/corporate-creditcardFunctions.js';
import { urlPath } from './formutils.js';
import { fetchJsonResponse, restAPICall } from './makeRestAPI.js';

/**
 * generates the otp
 * @param {object} mobileNumber
 * @param {object} pan
 * @param {object} dob
 * @return {PROMISE}
 */
function getOTP(mobileNumber, pan, dob) {
  const jsonObj = {
    requestString: {
      mobileNumber: mobileNumber.$value,
      dateOfBith: dob.$value || '',
      panNumber: pan.$value || '',
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      userAgent: window.navigator.userAgent,
      identifierValue: pan.$value || dob.$value,
      identifierName: pan.$value ? 'PAN' : 'DOB',
    },
  };
  const path = urlPath('/content/hdfc_ccforms/api/customeridentificationV4.json');
  return fetchJsonResponse(path, jsonObj, 'POST');
}

/**
 * otp validation
 * @param {object} globals - The global object containing necessary globals form data.
 */
function otpValidation(globals) {
  const payload = OTPVAL.getPayload(globals);
  restAPICall(globals, 'POST', payload, OTPVAL.path, OTPVAL.successCallback, OTPVAL.errorCallback, OTPVAL.loadingText);
}

/**
 * check offer
 * @param {string} firstName - The first name of the cardholder.
 * @param {string} middleName - The last name of the cardholder.
 * @param {string} lastName - The last name of the cardholder.
 * @param {object} globals - The global object containing necessary globals form data.
 */
function checkOffer(firstName, middleName, lastName, globals) {
  createPanValidationRequest(firstName, middleName, lastName, globals);
}

/**
 * resend otp
 *
 * @param {object} globals - The global object containing necessary globals form data.
 */
function resendOTP(globals) {
  restAPICall(
    globals,
    'POST',
    RESENDOTP.getPayload(globals),
    RESENDOTP.path,
    RESENDOTP.successCallback,
    RESENDOTP.errorCallback,
    RESENDOTP.loadingText,
  );
}

export {
  getOTP,
  otpValidation,
  resendOTP,
  checkOffer,
  getThisCard,
  prefillForm,
  getAddressDetails,
  pinCodeMaster,
  validateEmailID,
  currentAddressToggleHandler,
};
