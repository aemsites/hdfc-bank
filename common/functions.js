import { OTPGEN, OTPVAL } from '../creditcards/corporate-creditcardFunctions.js';
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

function validationPan(globals) { //triggered if tab-out -enter ---> handled
    const panNumber = globals.form.loginPanel.pan.$value;
    const errorMessages = document.getElementsByClassName('error-message');
    while (errorMessages.length) errorMessages[0].parentNode.removeChild(errorMessages[0]);
     const validatePAN = (panNumber) => {
     return /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]{1}$/.test(panNumber);
     }
     if (validatePAN(panNumber)) {
     // valid pan number
     const container = document.querySelector('.form-pan .error-message');
     container.remove();

     } else {
         const container = document.querySelector('.form-pan');
         const errorDivElement = document.createElement('div');
         errorDivElement.textContent = 'Please enter valid PAN number';
         errorDivElement.classList.add('error-message');
         container.appendChild(errorDivElement);
     }
}

function displayMobileNumber(globals){
const phoneNumber = globals.form.loginPanel.registeredMobileNumber.$value;
    const errorMessages = document.getElementsByClassName('error-message');
    while (errorMessages.length) errorMessages[0].parentNode.removeChild(errorMessages[0]);
     const validatePhone = (panNumber) => {
     return /^[6789]\d{9}$/.test(phoneNumber);
     }
     if (validatePhone(phoneNumber)) {
     // valid pan number
     const container = document.querySelector('.fform-registeredmobilenumber .error-message');
     container.remove();

     } else {
         const container = document.querySelector('.form-registeredmobilenumber');
         const errorDivElement = document.createElement('div');
         errorDivElement.textContent = 'Please enter valid Mobile number';
         errorDivElement.classList.add('error-message');
         container.appendChild(errorDivElement);
     }
}

export { getOTP, otpValidation ,validationPan,displayMobileNumber};
