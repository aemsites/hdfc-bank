/* eslint-disable no-underscore-dangle */
import {
  ageValidator,
  clearString,
  generateErefNumber,
  maskNumber,
  urlPath,
} from '../../common/formutils.js';
import * as FD_CONSTANT from './constant.js';
import * as CONSTANT from '../../common/constants.js';
import { displayLoader, fetchJsonResponse } from '../../common/makeRestAPI.js';
// import { addGaps } from './fdBacked-dom-functions.js'; // dom -function -- ? required in Form ?

const { FORM_RUNTIME: formRuntime, CURRENT_FORM_CONTEXT } = CONSTANT;
const { JOURNEY_NAME, FD_ENDPOINTS } = FD_CONSTANT;

let resendOtpCount = 0;
CURRENT_FORM_CONTEXT.journeyName = JOURNEY_NAME;
formRuntime.getOtpLoader = displayLoader;
formRuntime.otpValLoader = displayLoader;
formRuntime.validatePanLoader = (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.executeInterface = (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.ipa = (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.aadharInit = (typeof window !== 'undefined') ? displayLoader : false;

setTimeout(() => {
  if (typeof window !== 'undefined') {
    import('./fdBacked-dom-functions.js');
  }
}, 1200);

const validFDPan = (val) => {
  // Check if the input length is exactly 10 characters
  if (val?.length !== 10) return false;

  // Check the first 5 characters for alphabets
  if (![...val.slice(0, 5)]?.every((c) => /[a-zA-Z]/.test(c))) return false;

  // Check the next 4 characters for digits
  if (![...val.slice(5, 9)]?.every((c) => /\d/.test(c))) return false;

  // Check the last character for an alphabet
  if (!/[a-zA-Z]/.test(val[9])) return false;

  return true;
};
  /**
   * Validates the date of birth field to ensure the age is between 18 and 70.
   * @param {Object} globals - The global object containing necessary data for DAP request.
  */
const validateLogin = (globals) => {
  const dobValue = globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth.$value;
  const panValue = (globals.form.loginMainPanel.loginPanel.identifierPanel.pan.$value)?.replace(/\s+/g, ''); // remove white space
  const panDobSelection = globals.form.loginMainPanel.loginPanel.identifierPanel.panDobSelection.$value;
  const mobileNo = globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registeredMobileNumber.$value;
  const radioSelect = (panDobSelection === '0') ? 'DOB' : 'PAN';
  const panErrorText = FD_CONSTANT.ERROR_MSG.panError;

  const panInput = document.querySelector(`[name=${'pan'} ]`);
  const panWrapper = panInput.parentElement;

  const panIsValid = validFDPan(panValue);
  const dobIsValid = ageValidator(FD_CONSTANT.AGE_LIMIT.min, FD_CONSTANT.AGE_LIMIT.max, dobValue);
  const mobIsValid = (mobileNo && mobileNo?.length === 10);

  switch (radioSelect) {
    case 'DOB':
      if (dobValue && String(new Date(dobValue).getFullYear()).length === 4) {
        const dobErrorText = FD_CONSTANT.ERROR_MSG.ageLimit;
        if (dobIsValid && (mobIsValid)) {
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: true });
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', '', { useQualifiedName: true });
        }
        if (dobIsValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth, { valid: true });
        }
        if (!dobIsValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', dobErrorText, { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
        if (!(mobIsValid)) {
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
      } else if (!dobIsValid) {
        const dobErrorText = FD_CONSTANT.ERROR_MSG.ageLimit;
        globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', dobErrorText, { useQualifiedName: true });
        globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
      }
      break;
    case 'PAN':
      panWrapper.setAttribute('data-empty', true);
      if (panValue) {
        panWrapper.setAttribute('data-empty', false);
        if (panIsValid && (mobIsValid)) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.pan', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: true });
        }
        if (panIsValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.pan', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.identifierPanel.pan, { valid: true });
        }
        if (!panIsValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.pan', panErrorText, { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
        if (!(mobIsValid)) {
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
      }
      break;
    default:
      globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
  }
};

/**
   * Starts the timer for resending OTP.
   * @param {Object} globals - The global object containing necessary data for DAP request.
  */
function otpTimer(globals) {
  let sec = FD_CONSTANT.OTP_TIMER;
  let dispSec = FD_CONSTANT.OTP_TIMER;
  const { otpPanel } = globals.form.otpPanelWrapper;
  const timer = setInterval(() => {
    globals.functions.setProperty(otpPanel.otpPanel.resendOTPPanel.secondsPanel.seconds, { value: dispSec });
    sec -= 1;
    dispSec = sec;
    if (sec < 10) {
      dispSec = `0${dispSec}`;
    }
    if (sec < 0) {
      clearInterval(timer);
      globals.functions.setProperty(otpPanel.otpPanel.resendOTPPanel.secondsPanel, { visible: false });
      if (resendOtpCount < FD_CONSTANT.MAX_OTP_RESEND_COUNT) globals.functions.setProperty(otpPanel.otpPanel.resendOTPPanel.otpResend, { visible: true });
    }
  }, 1000);
}

/**
   * Starts the timer for resending OTP.
   * @param {Object} globals - The global object containing necessary data for DAP request.
   * @param {string} mobileNo - Registered mobile number
  */
const maskedMobNum = (mobileNo, globals) => {
  if (!(mobileNo?.length === 10)) return;
  globals.functions.setProperty(globals.form.loginMainPanel.maskedMobileNumber, { value: `${maskNumber(mobileNo, 6)}.` });
};

function updateOTPHelpText(mobileNo, otpHelpText, globals) {
  const maskedMobile = maskNumber(mobileNo, 6);
  globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.otpHelpText, { value: `${otpHelpText} ${maskedMobile}` });
}

/**
   * generates the otp
   * @param {object} mobileNumber
   * @param {object} pan
   * @param {object} dob
   * @param {object} globals
   * @return {PROMISE}
   */
const getOTP = (mobileNumber, pan, dob, globals) => {
  CURRENT_FORM_CONTEXT.journeyType = 'ETB';
  if (typeof window !== 'undefined') globals.functions.setProperty(globals.form.runtime.formUrl, { value: window.location.href });
  const { otpPanel } = globals.form.otpPanelWrapper.otpPanel;
  if (resendOtpCount < FD_CONSTANT.MAX_OTP_RESEND_COUNT) {
    globals.functions.setProperty(otpPanel.resendOTPPanel.secondsPanel, { visible: true });
    globals.functions.setProperty(otpPanel.resendOTPPanel.otpResend, { visible: false });
  } else {
    globals.functions.setProperty(otpPanel.resendOTPPanel.secondsPanel, { visible: false });
  }
  CURRENT_FORM_CONTEXT.action = 'getOTP';
  CURRENT_FORM_CONTEXT.journeyID = globals.form.runtime.journeyId.$value;
  CURRENT_FORM_CONTEXT.leadIdParam = globals.functions.exportData().queryParams;
  const panValue = (pan.$value)?.replace(/\s+/g, '');
  const jsonObj = {
    requestString: {
      dateOfBirth: clearString(dob.$value) || '',
      mobileNumber: mobileNumber.$value,
      panNumber: panValue?.toUpperCase() || '',
      journeyID: globals.form.runtime.journeyId.$value,
      journeyName: globals.form.runtime.journeyName.$value || CURRENT_FORM_CONTEXT.journeyName,
      identifierValue: panValue || dob.$value,
      identifierName: panValue ? 'PAN' : 'DOB',
    },
  };
  const path = urlPath(FD_ENDPOINTS.otpGen);
  formRuntime?.getOtpLoader();

  return fetchJsonResponse(path, jsonObj, 'POST', true);
};

/**
   * @name resendOTP
   * @param {Object} globals - The global object containing necessary data for DAP request.
   * @return {PROMISE}
   */
const resendOTP = async (globals) => {
  const { otpPanel } = globals.form.otpPanelWrapper.otpPanel;
  const mobileNo = globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber;
  const panValue = (globals.form.loginMainPanel.loginPanel.identifierPanel.pan);
  const dobValue = globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth;
  if (resendOtpCount < FD_CONSTANT.MAX_OTP_RESEND_COUNT) {
    resendOtpCount += 1;
    if (resendOtpCount === FD_CONSTANT.MAX_OTP_RESEND_COUNT) {
      globals.functions.setProperty(otpPanel.resendOTPPanel.secondsPanel, { visible: false });
      globals.functions.setProperty(otpPanel.resendOTPPanel.otpResend, { visible: false });
      globals.functions.setProperty(otpPanel.resendOTPPanel.maxAttemptMessage, { visible: true });
    }
    return getOTP(mobileNo, panValue, dobValue, globals);
  }
  return null;
};

/**
   * validates the otp
   * @param {object} mobileNumber
   * @param {object} pan
   * @param {object} dob
   * @return {PROMISE}
   */
const otpValidation = (mobileNumber, pan, dob, otpNumber, globals) => {
  // addGaps('.field-pannumberpersonaldetails input'); // dom -function -- ? required in Form ?
  const referenceNumber = generateErefNumber() ?? '';
  CURRENT_FORM_CONTEXT.referenceNumber = referenceNumber;
  const panValue = (pan.$value)?.replace(/\s+/g, ''); // remove white space
  const jsonObj = {
    requestString: {
      mobileNumber: mobileNumber.$value,
      passwordValue: otpNumber.$value,
      dateOfBirth: clearString(dob.$value) || '',
      panNumber: panValue?.toUpperCase() || '',
      channelSource: '',
      journeyID: CURRENT_FORM_CONTEXT.journeyID,
      journeyName: globals.form.runtime.journeyName.$value || CURRENT_FORM_CONTEXT.journeyName,
      dedupeFlag: 'N',
      referenceNumber: referenceNumber ?? '',
    },
  };
  const path = urlPath(FD_ENDPOINTS.otpVal);
  formRuntime?.otpValLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', true);
};

/**
   * does the custom show hide of panel or screens in resend otp.
   * @param {string} errorMessage
   * @param {number} numRetries
   * @param {object} globals
   */
function customSetFocus(errorMessage, numRetries, globals) {
  if (typeof numRetries === 'number' && numRetries < 1) {
    globals.functions.setProperty(globals.form.otpPanelWrapper, { visible: false });
    globals.functions.setProperty(globals.form.bannerImagePanel, { visible: false });
    globals.functions.setProperty(globals.form.resultPanel, { visible: true });
    globals.functions.setProperty(globals.form.resultPanel.errorResultPanel, { visible: true });
    globals.functions.setProperty(globals.form.resultPanel.errorResultPanel.errorMessageText, { value: errorMessage });
  }
}

const validateLoginFd = (globals) => {
  const mobileNo = globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registeredMobileNumber.$value;
  const isdCode = (globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.countryCode.$value)?.replace(/[^a-zA-Z0-9]+/g, '');
  const dobValue = globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth.$value;
  const panValue = globals.form.loginMainPanel.loginPanel.identifierPanel.pan.$value;
  const panDobSelection = globals.form.loginMainPanel.loginPanel.identifierPanel.panDobSelection.$value;
  const radioSelect = (panDobSelection === '0') ? 'DOB' : 'PAN';
  const consentFirst = globals.form.loginMainPanel.consent_fragment.checkboxConsent1Label.$value;
  const panErrorText = 'Please enter a valid PAN';
  const isdNumberPattern = /^(?!0)([5-9]\d{9})$/;
  const panIsValid = validFDPan(panValue);
  const nonISDNumberPattern = /^(?!0)\d{3,15}$/;
  let mobileNoValid = false;
  // currentFormContext.isdCode = isdCode;
  globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });

  const panInput = document?.querySelector(`[name=${'pan'} ]`);
  const panWrapper = panInput?.parentElement;

  // Mobile Field Validation
  if ((mobileNo && mobileNo.length == 1 && /^[0-5]/.test(mobileNo)) || (mobileNo && !(/^[0-9]/.test(mobileNo.slice(-1))))) {
    globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registeredMobileNumber, { value: '' });
  }
  if (mobileNo && ((isdCode === '91' && !isdNumberPattern.test(mobileNo)))) {
    globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registerMobileNumberError, { visible: true });
    globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
  } else {
    globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registerMobileNumberError, { visible: false });
    mobileNoValid = true;
  }

  // validatePanDynamically(globals.form.loginMainPanel.loginPanel.identifierPanel.pan, panValue, globals);

  switch (radioSelect) {
    case 'DOB':
      if (dobValue && String(new Date(dobValue).getFullYear()).length === 4) {
        const minAge = 18;
        const maxAge = 100;
        const dobErrorText = `Customers with age below ${minAge} years and above ${maxAge} are not allowed.`;
        const ageValid = ageValidate(minAge, maxAge, dobValue);
        if (ageValid && consentFirst && mobileNo && mobileNoValid) {
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: true });
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', '', { useQualifiedName: true });
        }
        if (ageValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth, { valid: true });
          globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.identifierPanel.dobErrorText, { visible: false });
        }
        if (!ageValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth', dobErrorText, { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.identifierPanel.dobErrorText, { visible: true });
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
        if (!consentFirst && !ageValid && (!mobileNo || mobileNoValid == false)) {
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
      }
      break;
    case 'PAN':
      panWrapper?.setAttribute('data-empty', true);
      if (panValue) {
        panWrapper?.setAttribute('data-empty', false);
        if (panIsValid && consentFirst && mobileNo && mobileNoValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.pan', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: true });
        }
        if (panIsValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.pan', '', { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.identifierPanel.pan, { valid: true });
          globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.identifierPanel.panErrorText, { visible: false });
        }
        if (!panIsValid) {
          globals.functions.markFieldAsInvalid('$form.loginMainPanel.loginPanel.identifierPanel.pan', panErrorText, { useQualifiedName: true });
          globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.identifierPanel.panErrorText, { visible: true });
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
        if (!consentFirst && (!mobileNo || mobileNoValid == false) && !panIsValid) {
          globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
        }
      }
      break;
    default:
      globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
  }
};

function editCreds(globals) {
  globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.otpHelpText, { value: '<p>We\'ve sent a 6-digit OTP&nbsp;to your registered mobile number&nbsp;</p>' });
  globals.functions.setProperty(globals.form.otpPanelWrapper, { visible: false });
  globals.functions.setProperty(globals.form.loginMainPanel, { visible: true });
}

const fetchCardDetails = async () => {
// const jsonObj = {
//   retailsProductCode:['dtdy66', ''],
//   bussinessProductCode:['dtdy66', '']
// };
// return fetchJsonResponse('./cardDetails.json', {}, 'POST', true);
  const cardUrl = '../../../creditcards/fd-backed-cc/cardDetails.json';
  return fetch(cardUrl)
    .then((response) => response.json());
};

const fetchCardDetailsSuccessHandler = async (response, globals) => {
  // console.log('reerereresss', response);
  const { functions } = globals;
  const { importData } = functions;

  const value = [{ retailCardName: 'hello', retailCardTagline: 'tetinff' }, { retailCardName: 'hell1o1', retailCardTagline: 'ppppp' }, { retailCardName: 'hello2', retailCardTagline: 'mmmmmm' }];

  importData(value, globals?.form?.landingPageMainWrapper?.perfectCardPanel?.retailCardsSectionMainWrapper?.retailCardsSection?.retailCardsSectionRepeatable?.$qualifiedName);
};

const retailCardAllFeaturesAndBenefits = (globals) => {
  console.log('globaslssss', globals);
};

const customerAccountDetails = (casaRes, globals) => {
  const { functions } = globals;
  const { importData } = functions;

  const value = casaRes[0].casaAccountDetails.map((account) => ({
    savingsAccNumber: account.accountNumber,
    balanceAmount: account.clearBalance,
  }));

  importData(value, globals.form?.accountSelectionWrapper?.accountSelectionPanel?.repeatWrapper?.$qualifiedName);

  setTimeout(() => {
    const panels = document.querySelectorAll("[data-repeatable='true']");
    let maxBalance = -Infinity;
    let selectedRadio = null;

    if (panels.length > 0) {
      panels.forEach((panel) => {
        const balanceInput = panel.querySelector("input[name='balanceAmount']");
        const checkbox = panel.querySelector("input[type='checkbox']");

        if (balanceInput && checkbox) {
          checkbox.type = 'radio';
          checkbox.name = 'accSelectionGroup';

          const balance = parseFloat(balanceInput.getAttribute('edit-value') || balanceInput.value || '0');

          if (balance > maxBalance) {
            maxBalance = balance;
            selectedRadio = checkbox;
          }
        }
      });

      if (selectedRadio) {
        selectedRadio.checked = true;
      }
    }
  }, 1000);
};

export {
  validateLogin,
  otpTimer,
  maskedMobNum,
  getOTP,
  otpValidation,
  resendOTP,
  customSetFocus,
  validFDPan,
  editCreds,
  updateOTPHelpText,
  fetchCardDetails,
  customerAccountDetails,
  fetchCardDetailsSuccessHandler,
  retailCardAllFeaturesAndBenefits,
  validateLoginFd,
};
