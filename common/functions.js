import { OTPGEN, OTPVAL, CHECKOFFER } from '../creditcards/corporate-creditcardFunctions.js';
import { restAPICall } from './makeRestAPI.js';
/**
 * generates the otp
 *
 * @param {object} globals - The global object containing necessary globals form data.
 */
function getOTP(globals) {
  const payload = OTPGEN.getPayload(globals);
  restAPICall(globals, 'POST', payload, OTPGEN.path, OTPGEN.successCallback, OTPGEN.errorCallback, OTPGEN.loadingText);
}

/**
 * otp validation
 *
 * @param {object} globals - The global object containing necessary globals form data.
 */
function otpValidation(globals) {
  const payload = OTPVAL.getPayload(globals);
  restAPICall(globals, 'POST', payload, OTPVAL.path, OTPVAL.successCallback, OTPVAL.errorCallback, OTPVAL.loadingText);
}

/**
 * otp validation
 *
 * @param {object} globals - The global object containing necessary globals form data.
 */
function checkOffer(globals) {
  restAPICall(globals, 'POST', CHECKOFFER.getPayload(globals), CHECKOFFER.path, CHECKOFFER.successCallback, CHECKOFFER.errorCallback, CHECKOFFER.loadingText);
}

export { getOTP, otpValidation, checkOffer };
