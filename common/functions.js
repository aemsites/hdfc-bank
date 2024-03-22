import {
  OTPGEN, OTPVAL, RESENDOTP, CHECKOFFER, getThisCard,
} from '../creditcards/corporate-creditcardFunctions.js';
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

/**
 * resend otp
 *
 * @param {object} globals - The global object containing necessary globals form data.
 */
function resendOTP(globals) {
  restAPICall(globals, 'POST', RESENDOTP.getPayload(globals), RESENDOTP.path, RESENDOTP.successCallback, RESENDOTP.errorCallback, RESENDOTP.loadingText);
}

export {
  getOTP, otpValidation, resendOTP, checkOffer, getThisCard,
};
