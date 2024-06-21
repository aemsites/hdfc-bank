/* eslint-disable no-console */
import {
  getThisCard,
  prefillForm,
  getAddressDetails,
  pinCodeMaster,
  validateEmailID,
  currentAddressToggleHandler,
  corpCreditCardContext,
  otpValHandler,
  journeyResponseHandler,
  createJourneyId,
  sendAnalytics,
  aadharConsent123,
  resendOTP,
  formRuntime,
} from '../creditcards/corporate-creditcardFunctions.js';

import { updatePanelVisibility } from './finaldaputils.js';

import {
  validatePan,
  panAPISuccesHandler,
} from './panvalidation.js';

import {
  executeInterfaceApi,
  executeInterfaceApiFinal,
  executeInterfacePostRedirect,
  ipaRequestApi,
  ipaSuccessHandler,
  executeInterfaceResponseHandler,
} from './executeinterfaceutils.js';

import documentUpload from './docuploadutils.js';

import fetchAuthCode from './idcomutil.js';

import {
  urlPath, santizedFormDataWithContext, getTimeStamp, formUtil, clearString,
} from './formutils.js';

import {
  fetchJsonResponse, hideLoaderGif,
} from './makeRestAPI.js';

import corpCreditCard from './constants.js';

const { endpoints } = corpCreditCard;
const { currentFormContext } = corpCreditCardContext;

/**
 * @name checkMode - check the location
 * @param {object} globals -
 * @return {PROMISE}
 */
function checkMode(globals) {
  debugger;
  const formData = globals.functions.exportData();
  const idcomVisit = formData?.queryParams?.authmode; // "DebitCard"
  const aadharVisit = formData?.queryParams?.visitType; // "EKYC_AUTH
  // temporarly added referenceNumber check for IDCOMM redirection to land on submit screen.
  if (aadharVisit === 'EKYC_AUTH' && formData?.aadhaar_otp_val_data?.message && formData?.aadhaar_otp_val_data?.message === 'Aadhaar OTP Validate success') {
    globals.functions.setProperty(globals.form.corporateCardWizardView, { visible: true });
    globals.functions.setProperty(globals.form.otpPanel, { visible: false });
    globals.functions.setProperty(globals.form.loginPanel, { visible: false });
    globals.functions.setProperty(globals.form.getOTPbutton, { visible: false });
    globals.functions.setProperty(globals.form.consentFragment, { visible: false });
    globals.functions.setProperty(globals.form.welcomeText, { visible: false });
    const {
      result: {
        Address1, Address2, Address3, City, State, Zipcode,
      },
    } = formData.aadhaar_otp_val_data;
    const {
      executeInterfaceReqObj: {
        requestString: {
          officeAddress1, officeAddress2, officeAddress3, officeCity, officeState, officeZipCode,
          communicationAddress1, communicationAddress2, communicationAddress3, communicationCity, communicationState, comCityZip,
        },
      },
    } = formData.currentFormContext;
    const aadharAddress = [Address1, Address2, Address3, City, State, Zipcode]?.filter(Boolean)?.join(', ');
    const officeAddress = [officeAddress1, officeAddress2, officeAddress3, officeCity, officeState, officeZipCode]?.filter(Boolean)?.join(', ');
    const communicationAddress = [communicationAddress1, communicationAddress2, communicationAddress3, communicationCity, communicationState, comCityZip]?.filter(Boolean)?.join(', ');
    const { AddressDeclarationAadhar, addressDeclarationOffice, CurrentAddressDeclaration } = globals.form.corporateCardWizardView.confirmAndSubmitPanel.addressDeclarationPanel;
    globals.functions.setProperty(AddressDeclarationAadhar.aadharAddressSelectKYC, { value: aadharAddress });
    globals.functions.setProperty(addressDeclarationOffice.officeAddressSelectKYC, { value: officeAddress });
    globals.functions.setProperty(CurrentAddressDeclaration.currentResidenceAddress, { value: communicationAddress });
  } if (idcomVisit === 'DebitCard') {
    const resultPanel = formUtil(globals, globals.form.resultPanel);
    resultPanel.visible(false);
    globals.functions.setProperty(globals.form.otpPanel, { visible: false });
    globals.functions.setProperty(globals.form.loginPanel, { visible: false });
    globals.functions.setProperty(globals.form.getOTPbutton, { visible: false });
    globals.functions.setProperty(globals.form.consentFragment, { visible: false });
    globals.functions.setProperty(globals.form.welcomeText, { visible: false });
    globals.functions.setProperty(globals.form.resultPanel.successResultPanel, { visible: false });
    globals.functions.setProperty(globals.form.resultPanel.errorResultPanel, { visible: false });
    globals.functions.setProperty(globals.form.confirmResult, { visible: false });
    executeInterfacePostRedirect('idCom', globals);
  }
}

/**
 * does the custom show hide of panel or screens in resend otp.
 * @param {string} errorMessage
 * @param {number} numRetries
 * @param {object} globals
 */
function customSetFocus(errorMessage, numRetries, globals) {
  if (typeof numRetries === 'number' && numRetries < 1) {
    globals.functions.setProperty(globals.form.otpPanel, { visible: false });
    globals.functions.setProperty(globals.form.submitOTP, { visible: false });
    globals.functions.setProperty(globals.form.resultPanel, { visible: true });
    globals.functions.setProperty(globals.form.resultPanel.errorResultPanel, { visible: true });
    globals.functions.setProperty(globals.form.resultPanel.errorResultPanel.errorMessageText, { value: errorMessage });
  }
}

/**
 * generates the otp
 * @param {object} mobileNumber
 * @param {object} pan
 * @param {object} dob
 * @param {object} globals
 * @return {PROMISE}
 */
function getOTP(mobileNumber, pan, dob, globals) {
  currentFormContext.action = 'getOTP';
  currentFormContext.journeyID = globals.form.runtime.journeyId.$value;
  console.log(currentFormContext);
  // currentFormContext.leadProfile = {};
  const jsonObj = {
    requestString: {
      mobileNumber: mobileNumber.$value,
      dateOfBith: dob.$value || '',
      panNumber: pan.$value || '',
      journeyID: globals.form.runtime.journeyId.$value,
      journeyName: corpCreditCard.journeyName,
      userAgent: window.navigator.userAgent,
      identifierValue: pan.$value || dob.$value,
      identifierName: pan.$value ? 'PAN' : 'DOB',
    },
  };
  const path = urlPath(endpoints.otpGen);
  formRuntime?.getOtpLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', true);
}

/**
 * validates the otp
 * @param {object} mobileNumber
 * @param {object} pan
 * @param {object} dob
 * @return {PROMISE}
 */
function otpValidation(mobileNumber, pan, dob, otpNumber) {
  const referenceNumber = `AD${getTimeStamp(new Date())}` ?? '';
  currentFormContext.referenceNumber = referenceNumber;
  const jsonObj = {
    requestString: {
      mobileNumber: mobileNumber.$value,
      passwordValue: otpNumber.$value,
      dateOfBirth: clearString(dob.$value) || '',
      panNumber: pan.$value || '',
      channelSource: '',
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      dedupeFlag: 'N',
      userAgent: window.navigator.userAgent,
      referenceNumber: referenceNumber ?? '',
    },
  };
  const path = urlPath(endpoints.otpValFetchAssetDemog);
  formRuntime?.otpValLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', true);
}

function getOS() {
  const { userAgent } = window.navigator;
  const { platform } = window.navigator;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
  let os = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'Mac OS';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = 'iOS';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'Windows';
  } else if (/Android/.test(userAgent)) {
    os = 'Android';
  } else if (!os && /Linux/.test(platform)) {
    os = 'Linux';
  }

  return os;
}

function getDevice() {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowser() {
  const ua = navigator.userAgent; let tem; let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return { name: 'IE', version: (tem[1] || '') };
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\bOPR|Edge\/(\d+)/);
    if (tem != null) { return { name: 'Opera', version: tem[1] }; }
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  // eslint-disable-next-line no-cond-assign
  if ((tem = ua.match(/version\/(\d+)/i)) != null) { M.splice(1, 1, tem[1]); }
  return {
    name: M[0],
    version: M[1],
    majver: '',
  };
}

function updateFormElement(form, key, value) {
  const field = document.createElement('input');
  field.setAttribute('type', 'hidden');
  field.setAttribute('name', key);
  field.setAttribute('value', value);
  form.appendChild(field);
}

/**
 * aadharInit
 * @param {object} mobileNumber
 * @param {object} pan
 * @param {object} dob
 * @param {object} globals - The global object containing necessary globals form data.
 * @return {PROMISE}
 */
async function aadharInit(mobileNumber, pan, dob, globals) {
  currentFormContext.VISIT_TYPE = 'AADHAR';
  const jsonObj = {
    requestString: {
      initParameters: {
        journeyId: currentFormContext.journeyID,
        transactionId: currentFormContext.journeyID.replace(/-/g, '').replace(/_/g, ''),
        journeyName: corpCreditCard.journeyName,
        userAgent: window.navigator.userAgent,
        mobileNumber: mobileNumber.$value,
        leadProfileId: globals?.form.runtime.leadProifileId.$value,
        additionalParam1: '',
        additionalParam2: '',
        identifierValue: pan.$value || dob.$value,
        identifierName: pan.$value ? 'PAN' : 'DOB',
      },
      auth: {
        journey_key: currentFormContext.journeyID,
        service_code: 'XX2571ER',
      },
      existingCustomer: currentFormContext.journeyType === 'NTB' ? 'N' : 'Y',
      data_otp_gen: {
        UID_NO: '',
      },
      data_app: {
        journey_id: currentFormContext.journeyID,
        lead_profile_id: globals?.form.runtime.leadProifileId.$value,
        callback: urlPath(endpoints.aadharCallback),
        lead_profile: {
          leadProfileId: globals?.form.runtime.leadProifileId.$value,
          mobileNumber: mobileNumber.$value,
          Addresses: '',
        },
        journeyStateInfo: {
          state: 'CUSTOMER_AADHAR_VALIDATION',
          stateInfo: corpCreditCard.journeyName,
          formData: santizedFormDataWithContext(globals, currentFormContext),
        },
        auditData: {
          action: 'CUSTOMER_AADHAR_VALIDATION',
          auditType: 'Regulatory',
        },
        filler1: 'filler1',
        filler2: 'filler2',
        filler3: 'filler3',
        filler4: 'filler4',
        filler5: 'filler5',
        filler6: 'filler6',
        filler7: 'filler7',
        filler8: 'filler8',
        filler9: 'filler9',
        filler10: 'filler10',
      },
      client_info: {
        browser: getBrowser(),
        cookie: {
          source: 'AdobeForms',
          name: 'NTBCC',
          ProductShortname: 'IS',
        },
        client_ip: '',
        device: {
          type: getDevice(),
          name: 'Samsung G5',
          os: getOS(),
          os_ver: '637.38383',
        },
        isp: {
          ip: '839.893.89.89',
          provider: 'AirTel',
          city: 'Mumbai',
          state: 'Maharashrta',
          pincode: '400828',
        },
        geo: {
          lat: '72.8777° E',
          long: '19.0760° N',
        },
      },
    },
  };

  const path = urlPath(endpoints.aadharInit);
  const response = fetchJsonResponse(path, jsonObj, 'POST');
  response
    .then((res) => {
      console.log(res);
      // var aadharValidationForm = "<form action=" + res.RedirectUrl + " method='post'></form>";
      const aadharValidationForm = document.createElement('form');
      aadharValidationForm.setAttribute('action', res.RedirectUrl);
      aadharValidationForm.setAttribute('method', 'POST');
      // eslint-disable-next-line guard-for-in, no-restricted-syntax
      for (const key in res) {
        updateFormElement(aadharValidationForm, key, res[key]);
      }
      document.querySelector('body').append(aadharValidationForm);
      // aadharValidationForm.appendTo('body');
      aadharValidationForm.submit();
    }).catch((err) => console.log(err));
}

/**
 * Redirects the browser to the specified URL.
 *
 * @name redirect
 * @param {string} redirectUrl - The URL to redirect the browser to.
 */
function redirect(redirectUrl) {
  window.location.href = redirectUrl;
}

export {
  getOTP,
  otpValidation,
  getThisCard,
  prefillForm,
  getAddressDetails,
  pinCodeMaster,
  validateEmailID,
  currentAddressToggleHandler,
  aadharInit,
  checkMode,
  otpValHandler,
  customSetFocus,
  journeyResponseHandler,
  corpCreditCardContext,
  createJourneyId,
  validatePan,
  panAPISuccesHandler,
  executeInterfaceApi,
  ipaRequestApi,
  ipaSuccessHandler,
  sendAnalytics,
  aadharConsent123,
  resendOTP,
  fetchAuthCode,
  redirect,
  hideLoaderGif,
  executeInterfacePostRedirect,
  executeInterfaceApiFinal,
  executeInterfaceResponseHandler,
  documentUpload,
};
