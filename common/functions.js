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
  finalDap,
  currentFormContext,
} from '../creditcards/corporate-creditcardFunctions.js';
import { urlPath, santizedFormData } from './formutils.js';
import { fetchJsonResponse, restAPICall } from './makeRestAPI.js';

/**
 * @name checkMode - check the location
 * @param {object} globals -
 */
function checkMode(globals) {
  debugger;
  const formData = globals.functions.exportData();
  if (formData.aadhaar_otp_val_data.result.Address1) {
    currentFormContext.jwtToken = formData?.currentFormContext?.jwtToken
    currentFormContext.productDetails = formData?.currentFormContext?.productDetails?.[0];
    currentFormContext.executeInterfaceReqObj = formData?.currentFormContext?.executeInterfaceReqObj
    globals.functions.setProperty(globals.form.corporateCardWizardView, { visible: true });
    globals.functions.setProperty(globals.form.otpPanel, { visible: false });
    globals.functions.setProperty(globals.form.loginPanel, { visible: false });
    globals.functions.setProperty(globals.form.getOTPbutton, { visible: false });
    globals.functions.setProperty(globals.form.consentFragment, { visible: false });
    globals.functions.setProperty(globals.form.welcomeText, { visible: false });
  }
}

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
 * aadharInit
 * @param {object} mobileNumber
 * @param {object} pan
 * @param {object} dob
 * @param {object} globals - The global object containing necessary globals form data.
 * @return {PROMISE}
 */
async function aadharInit(mobileNumber, pan, dob, globals) {
  debugger;
  
  const jsonObj = {
    requestString: {
      initParameters: {
        journeyId: currentFormContext.journeyID,
        transactionId: currentFormContext.journeyID.replace(/-/g, '').replace(/_/g, ''),
        journeyName: 'CORPORATE_CARD_JOURNEY',
        userAgent: window.navigator.userAgent,
        mobileNumber: mobileNumber.$value,
        leadProfileId: currentFormContext.leadProfile,
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
        lead_profile_id: currentFormContext.leadProfile,
        callback: 'https://applyonlinedev.hdfcbank.com/content/hdfc_etb_wo_pacc/api/aadharCallback.json',
        lead_profile: {
          leadProfileId: currentFormContext.leadProfile,
          mobileNumber: mobileNumber.$value,
          Addresses: '',
        },
        journeyStateInfo: {
          state: 'CUSTOMER_AADHAR_VALIDATION',
          stateInfo: 'CORPORATE_CARD_JOURNEY',
          formData: santizedFormData(globals)
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
        browser: get_browser(),
        cookie: {
          source: 'AdobeForms',
          name: 'NTBCC',
          ProductShortname: 'IS',
        },
        client_ip: '',
        device: {
          type: get_device(),
          name: 'Samsung G5',
          os: get_OS(),
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
  const path = 'https://applyonlinedev.hdfcbank.com/content/hdfc_etb_wo_pacc/api/aadharInit.json';
  const response = fetchJsonResponse(path, jsonObj, 'POST');
  response
    .then((res) => {
      console.log(res);
      // var aadharValidationForm = "<form action=" + res.RedirectUrl + " method='post'></form>";
      const aadharValidationForm = document.createElement('form');
      aadharValidationForm.setAttribute('action', res.RedirectUrl);
      aadharValidationForm.setAttribute('method', 'POST');
      for (const key in res) {
        updateFormElement(aadharValidationForm, key, res[key]);
      }
      document.querySelector('body').append(aadharValidationForm);
      // aadharValidationForm.appendTo('body');
      debugger;
      aadharValidationForm.submit();
    }).catch((err) => console.log(err));
}

function get_OS() {
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

function get_device() {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

function get_browser() {
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

async function callJourneyDropffparams(journey_id, lead_profile_id) {
  const payLoad = {
    RequestPayload: {
      journeyInfo: {
        journeyID: journey_id,
      },
      leadProfile: {
        leadProfileId: lead_profile_id,
      },
    },
  };
  const path = urlPath('/content/hdfc_commonforms/api/journeydropoffparam.json');
  return fetchJsonResponse(path, payLoad, 'POST');
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
  finalDap,
  aadharInit,
  checkMode,
};
