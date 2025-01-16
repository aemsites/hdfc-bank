import {
    ENDPOINTS,
    CURRENT_FORM_CONTEXT as currentFormContext,
    FORM_RUNTIME as formRuntime,
  } from '../../common/constants.js';

import {
  EFFD_ENDPOINTS,
} from './constant.js';

import {
    createJourneyId,
} from './fd-external-funding-journey-utils.js';

import {
  sendAnalytics,
  sendPageloadEvent,
} from './analytics.js';

import {
    clearString,
    urlPath,
    getTimeStamp,
    maskNumber,
    moveWizardView,
    formUtil,
    convertDateToMmmDdYyyy,
    santizedFormDataWithContext,
  } from '../../common/formutils.js';

  import {
    displayLoader,
    hideLoaderGif,
    fetchJsonResponse,
    getJsonResponse,
  } from '../../common/makeRestAPI.js';

import {CHANNEL, JOURNEY_NAME, VISIT_MODE} from './constant.js';

let resendOtpCount = 0;
const MAX_OTP_RESEND_COUNT = 3;
const OTP_TIMER = 30;
let MAX_COUNT = 3;
let sec = OTP_TIMER;
let dispSec = OTP_TIMER;

currentFormContext.journeyName = 'FD_EXTERNAL_FUNDING_JOURNEY';
currentFormContext.journeyType = 'ETB';
currentFormContext.errorCode = '';
currentFormContext.errorMessage = '';
currentFormContext.eligibleOffers = '';
currentFormContext.selectedCheckedValue = 0;
currentFormContext.productAccountType = '';
currentFormContext.productAccountName = '';
currentFormContext.journeyAccountType = '';
currentFormContext.countryName = '';
currentFormContext.phoneWithISD = '';
currentFormContext.ambValue = '';
currentFormContext.territoryName = '';
currentFormContext.territoryKey = '';

formRuntime.getOtpLoader = currentFormContext.getOtpLoader || (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.otpValLoader = currentFormContext.otpValLoader || (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.hideLoader = (typeof window !== 'undefined') ? hideLoaderGif : false;


// /**
//  * Function to prefill a hidden field, invoking fdExternalFundingInit.
//  * @name fdExternalFundingInit
//  * @param {Object} globals - The global object containing necessary data.
//  */
// function fdExternalFundingInit(globals) {
//     globals.functions.setProperty(globals.form.runtime.journeyName, { value: currentFormContext.journeyName }); // Setting the hidden field
//     globals.functions.setProperty(globals.form.parentLandingPagePanel.landingPanel.init_hidden_field, { value: 'INIT' }); // Setting the hidden field
// }

/**
 * Validates the date of birth field to ensure the age is between 18 and 120.
 * @param {Object} globals - The global object containing necessary data for DAP request.
*/

const validFDPan = (val) => {
    if (val?.length !== 10) return false;
    // if (val?.length !== 12) return false; // TODO : Commented this, since the Test data was 12 chars.
    if (![...val.slice(0, 5)]?.every((c) => /[a-zA-Z]/.test(c))) return false;
    return true;
};

const ageValidate = (minAge, maxAge, dobValue) => {
    const birthDate = new Date(dobValue);
  
    const today = new Date();
  
    let age = today.getFullYear() - birthDate.getFullYear();
  
    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();
  
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
  
    if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay <= birthDay)) {
      age -= 1;
    }
  
    return age >= minAge && age < maxAge;
};

const validateLoginFd = (globals) => {
    const mobileNo = globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registeredMobileNumber.$value;
    const isdCode = (globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.countryCode.$value)?.replace(/[^a-zA-Z0-9]+/g, '');
    const dobValue = globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth.$value;
    const panValue = globals.form.loginMainPanel.loginPanel.identifierPanel.pan.$value;
    const panDobSelection = globals.form.loginMainPanel.loginPanel.identifierPanel.panDobSelection.$value;
    const radioSelect = (panDobSelection === '0') ? 'DOB' : 'PAN';
    const consentFirst = globals.form.loginMainPanel.consent_fragment.checkboxConsent1Label.$value;
    const panErrorText = 'Please enter a valid PAN Number';
    const isdNumberPattern = /^(?!0)([5-9]\d{9})$/;
    const panIsValid = validFDPan(panValue);
    const nonISDNumberPattern = /^(?!0)\d{3,15}$/;
    currentFormContext.isdCode = isdCode;
    globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
  
    const panInput = document?.querySelector(`[name=${'pan'} ]`);
    const panWrapper = panInput?.parentElement;
  
    switch (radioSelect) {
      case 'DOB':
        if (dobValue && String(new Date(dobValue).getFullYear()).length === 4) {
          const minAge = 18;
          const maxAge = 100;
          const dobErrorText = `Customers with age below ${minAge} years and above ${maxAge} are not allowed.`;
          const ageValid = ageValidate(minAge, maxAge, dobValue);
          if (ageValid && consentFirst && mobileNo) {
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
          if (!consentFirst && !ageValid && !mobileNo) {
            globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
          }
        }
        break;
      case 'PAN':
        panWrapper?.setAttribute('data-empty', true);
        if (panValue) {
          panWrapper?.setAttribute('data-empty', false);
          if (panIsValid && consentFirst && mobileNo) {
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
          if (!consentFirst && !mobileNo && !panIsValid) {
            globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
          }
        }
        break;
      default:
        globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
    }
    if (mobileNo && ((isdCode === '91' && !isdNumberPattern.test(mobileNo))
      || (isdCode !== '91' && !nonISDNumberPattern.test(mobileNo)))) {
      globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registerMobileNumberError, { visible: true });
      globals.functions.setProperty(globals.form.loginMainPanel.getOTPbutton, { enabled: false });
    } else {
      globals.functions.setProperty(globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registerMobileNumberError, { visible: false });
    }
  };


/**

  {
    "requestString" : {
        "common":{
            "journeyID": "e27b4a83-cab0-40c2-8aa0-e7d697bf1780_01_FD_EXTERNAL_FUNDING_JOURNEY_U_WEB",
            "journeyName": "FD_EXTERNAL_FUNDING_JOURNEY",
            "mobileNumber": "917911312377",
            "userAgent": "ABCBBABCA"
        },
        "otpGen": {
            "version": "V2",
            "payload": {
                "dateOfBirth": "19840625",
                "panNumber": "",
                "referenceNumber": "AD203505182114",
                "mobileNumber": "917911312377"
            }
        },
        "customerIdentification": {
            "version": "V1",
            "payload": {
                "dateOfBirth": "19840625",
                "panNumber": "",
                "referenceNumber": "AD203505182114",
                "mobileNumber": "917911312377"
            }
        }
    }
}

 */

const getOtpExternalFundingFD = async (mobileNumber, pan, dob, globals) => {
    // const jidTemporary = createJourneyId(VISIT_MODE, JOURNEY_NAME, CHANNEL, globals);
    /* jidTemporary  temporarily added for FD development it has to be removed completely once runtime create journey id is done with FD */
    const jidTemporary = createJourneyId(VISIT_MODE, JOURNEY_NAME, CHANNEL, globals);
    globals.functions.setProperty(globals.form.runtime.journeyName, { value: 'FD_EXTERNAL_FUNDING_JOURNEY' });
    const [year, month, day] = dob.$value ? dob.$value.split('-') : ['', '', ''];
    currentFormContext.action = 'getOTP';
    currentFormContext.journeyID = globals.form.runtime.journeyId.$value || jidTemporary;
    currentFormContext.mobileNumber = mobileNumber.$value;
    currentFormContext.leadIdParam = globals.functions.exportData().queryParams;
    let identifierNam = '';
    let identifierVal = '';
    let datOfBirth = '';
    if (pan.$value != null) {
      identifierNam = 'PAN';
      identifierVal = pan.$value;
      dob.$value = '';
      datOfBirth = '';
    } else {
      identifierNam = 'DOB';
      identifierVal = dob.$value;
      pan.$value = '';
      datOfBirth = year + month + day;
    }
    
    const jsonObj = {
      requestString: {
        common: {
          journeyID: globals.form.runtime.journeyId.$value ?? jidTemporary,
          // journeyName: globals.form.runtime.journeyName.$value || currentFormContext.journeyName,
          journeyName: 'FD_EXTERNAL_FUNDING_JOURNEY',
          mobileNumber: currentFormContext.isdCode + mobileNumber.$value,
          userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
          identifierValue: clearString(identifierVal),
          identifierName: identifierNam,
        },
        customerIdentification: {
          version: "V1",
          payload: {
            dateOfBirth: datOfBirth,
            panNumber: clearString(pan.$value || ''),
            mobileNumber: currentFormContext.isdCode + mobileNumber.$value,
          }
        },
        otpGen: {
          version: "V2",
          payload: {
            dateOfBirth: datOfBirth,
            panNumber: clearString(pan.$value || ''),
            mobileNumber: currentFormContext.isdCode + mobileNumber.$value,
          }
        }
      }
    };
  
    const path = urlPath(EFFD_ENDPOINTS.customerOtpGen);
    formRuntime?.getOtpLoader();
    // return fetchJsonResponse(path, jsonObj, 'POST', true);

    return JSON.parse("{\"otpGen\":{\"existingCustomer\":\"Y\",\"formURL\":\"/content/forms/af/hdfc_haf/assets/fd-external-funding/forms/external-funding.html\",\"status\":{\"errorCode\":\"00000\",\"errorMsg\":\"Yourrequestcouldnotbeprocessed,Pleasetryagaintocontinue\"}},\"customerIdentification\":{\"existingCustomer\":\"Y\",\"status\":{\"errorCode\":\"0\",\"errorMsg\":\"Success\"}}}");
  };

/**
 * Starts the Nre_Nro OTPtimer for resending OTP.
 * @param {Object} globals - The global object containing necessary data for DAP request.
*/
function otpTimer(globals) {
  formRuntime?.hideLoader();
  if (resendOtpCount < MAX_OTP_RESEND_COUNT) {
    globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.secondsPanel.seconds, { visible: true });
    globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.otpResend, { visible: false });
  } else {
    globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.secondsPanel, { visible: false });
  }
  const timer = setInterval(() => {
    sec -= 1;
    dispSec = sec;
    if (sec < 10) {
      dispSec = `0${sec}`;
    }
    globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.secondsPanel.seconds, { value: dispSec });
    if (sec < 0) {
      clearInterval(timer);
      globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.secondsPanel, { visible: false });
      if (resendOtpCount < MAX_OTP_RESEND_COUNT) {
        globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.otpResend, { visible: true });
      }
    }
  }, 1000);
}

/**
 * @name resendOTP
 * @param {Object} globals - The global object containing necessary data for DAP request.
 * @return {PROMISE}
 */
const resendOTP = async (globals) => {
  const {
    mobileNumber,
    journeyID,
  } = currentFormContext;

  dispSec = OTP_TIMER;
  const mobileNo = globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registeredMobileNumber;
  const panValue = globals.form.loginMainPanel.loginPanel.identifierPanel.pan;
  const dobValue = globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth;
  globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.otpResend, { visible: false });
  globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.secondsPanel, { visible: true });
  globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.secondsPanel.seconds, { value: dispSec });
  globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.incorrectOTPText, { visible: false });
  globals.functions.setProperty(globals.form.otpPanelWrapper.submitOTP, { enabled: false });
  if (resendOtpCount < MAX_OTP_RESEND_COUNT) {
    resendOtpCount += 1;

    const otpResult = await getOtpExternalFundingFD(mobileNo, panValue, dobValue, globals);
    // invokeJourneyDropOffUpdate('CUSTOMER_LEAD_QUALIFIED', mobileNumber, globals.form.runtime.leadProifileId.$value, journeyID, globals);
    globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.secondsPanel.seconds, { value: dispSec });
    if (otpResult && otpResult.customerIdentification.existingCustomer === 'Y') {
      sec = OTP_TIMER;
      globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.otpSubPanel.numRetries, { value: (MAX_OTP_RESEND_COUNT - resendOtpCount)});
      otpTimer(globals);
    } else {
      globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.otpPanel.errorMessage, { visible: true, message: otpResult.message });
      globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.otpResend, { visible: true });
    }

    if (resendOtpCount === MAX_OTP_RESEND_COUNT) {
      globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.secondsPanel, { visible: false });
      globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.otpResend, { visible: false });
      globals.functions.setProperty(globals.form.otpPanelWrapper.otpPanel.otpPanel.resendOTPPanel.maxAttemptMessage, { visible: true });
    }
    return otpResult;
  }

  return null; // Return null if max attempts reached
};

const onPageLoadAnalytics = async (globals) => {
    sendAnalytics('page load_Step 1', {}, 'CUSTOMER_IDENTITY_INITIATED', globals);
};

setTimeout(() => {
  if(typeof window !== 'undefined' && typeof _satellite !== 'undefined'){
    const params = new URLSearchParams(window.location.search);
    if(params?.get('success') !== 'true' || (params?.get('authmode') !== 'DebitCard' && params?.get('authmode') !== 'NetBanking')){
      onPageLoadAnalytics();
    }
  }
}, 5000);

export {
    validateLoginFd,
    getOtpExternalFundingFD,
    otpTimer,
    resendOTP,
}