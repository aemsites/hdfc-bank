/* eslint-disable no-undef */
import {
  data,
  ANALYTICS_CLICK_OBJECT,
  ANALYTICS_PAGE_LOAD_OBJECT,
  PAGE_NAME,
} from './analyticsConstants.js';
import {
  createDeepCopyFromBlueprint,
  santizedFormDataWithContext,
} from './formutils.js';
import corpCreditCard from './constants.js';
import { corpCreditCardContext } from './journey-utils.js';

const { currentFormContext } = corpCreditCardContext;

/**
 * set analytics generic props for page load
 * @name setAnalyticPageLoadProps
 * @param {string} linkName - linkName
 * @param {string} linkType - linkName
 * @param {object} formContext - currentFormContext.
 * @param {object} digitalData
 */

function setAnalyticPageLoadProps(journeyState, formData, digitalData) {
  digitalData.page.pageInfo.pageName = 'Identify Yourself';
  digitalData.user.pseudoID = '';// Need to check
  digitalData.user.journeyName = currentFormContext?.journeyName;
  digitalData.user.journeyID = formData?.journeyId;
  digitalData.user.journeyState = journeyState;
  digitalData.user.casa = '';
  digitalData.form.name = corpCreditCard.formName;
}

/**
 * set analytics generic props for click event
 * @name setAnalyticClickGenericProps
 * @param {string} linkName - linkName
 * @param {string} linkType - linkName
 * @param {object} formContext - currentFormContext.
 * @param {object} digitalData
 */

function setAnalyticClickGenericProps(linkName, linkType, formData, journeyState, digitalData) {
  digitalData.link = {
    linkName,
    linkType,
  };
  digitalData.link.linkPosition = data[linkName].linkPosition;
  digitalData.user.pseudoID = '';
  digitalData.user.journeyName = currentFormContext?.journeyName;
  digitalData.user.journeyID = currentFormContext?.journeyID;
  digitalData.user.journeyState = journeyState;
  if (linkName === 'otp click') {
    digitalData.form.name = corpCreditCard.formName;
    digitalData.user.casa = '';
  } else {
    digitalData.form.name = formData.etbFlowSelected === 'on' ? `${corpCreditCard.formName}-ETB` : `${corpCreditCard.formName}-NTB`;
    digitalData.user.casa = formData.etbFlowSelected === 'on' ? 'Yes' : 'No';
  }
  // window.digitalData = digitalData || {};
}

const getValidationMethod = (formContext) => {
  if (formContext && formContext?.login && formContext.login.panDobSelection) {
    return formContext.login.panDobSelection === '0' ? 'DOB' : 'PAN';
  }
  return '';
};

/**
 * Sends analytics event on page load.
 * @name sendPageloadEvent
 * @param {string} journeyState.
 * @param {object} formData.
 */
function sendPageloadEvent(journeyState, formData) {
  const digitalData = createDeepCopyFromBlueprint(ANALYTICS_PAGE_LOAD_OBJECT);
  setAnalyticPageLoadProps(journeyState, formData, digitalData);
  switch (currentFormContext.action) {
    case 'check offers': {
      digitalData.page.pageInfo.pageName = PAGE_NAME['get this card'];
      digitalData.card.selectedCard = '';
      digitalData.card.eligibleCard = '';
      break;
    }
    case 'confirmation': {
      // ((mobileValid === 'n')&&aadhaar_otp_val_data?.result?.mobileValid)
      // arn_num
      digitalData.page.pageInfo.pageName = PAGE_NAME['start kyc'];
      const formCallBackContext = currentFormContext?.pageGotRedirected ? formData?.currentFormContext : currentFormContext;
      digitalData.formDetails = {
        reference: formCallBackContext?.ARN_NUM,
        isVideoKYC: formCallBackContext?.isVideoKYC ? 'Yes' : 'no', // value - ? 'yes' or 'no' if aadhar and then applicationMismatch
      };
      break;
    }
    default:
      // do nothing
  }
  if (window) {
    window.digitalData = digitalData || {};
  }
  _satellite.track('pageload');
}

/**
 *Creates digital data for otp click event.
 * @param {string} phone
 * @param {string} validationType
 * @param {string} eventType
 * @param {object} formContext
 * @param {object} digitalData
 */
function sendSubmitClickEvent(phone, eventType, linkType, formData, journeyState, digitalData) {
  setAnalyticClickGenericProps(eventType, linkType, formData, journeyState, digitalData);
  switch (eventType) {
    case 'otp click': {
      digitalData.page.pageInfo.pageName = PAGE_NAME[eventType];
      digitalData.event = {
        phone,
        validationMethod: getValidationMethod(formData),
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }
    case 'check offers': {
      digitalData.page.pageInfo.pageName = PAGE_NAME[eventType];
      digitalData.user.gender = formData.form.gender;
      digitalData.user.email = formData.form.workEmailAddress;
      if (formData.form.currentAddressToggle === 'off') {
        digitalData.formDetails = {
          pincode: currentFormContext?.breDemogResponse?.VDCUSTZIPCODE,
          city: currentFormContext?.breDemogResponse?.VDCUSTCITY,
          state: currentFormContext?.breDemogResponse?.VDCUSTSTATE,
        };
      } else {
        const isETB = currentFormContext.journeyType === 'ETB';
        digitalData.formDetails = {
          pincode: isETB ? formData?.form?.newCurentAddressPin : formData?.form?.currentAddresPincodeNTB,
          city: isETB ? 'hardcodedETBCity' : 'hardcodedNTBCity',
          state: isETB ? 'hardcodedETBState' : 'hardcodedNTBState',
        };
      }
      Object.assign(digitalData.formDetails, {
        employmentType: formData?.form?.employmentType,
        companyName: formData?.form?.companyName,
        designation: formData?.form?.designation,
        relationshipNumber: formData?.form?.relationshipNumber,
      });
      currentFormContext.action = 'check offers';
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      setTimeout(() => {
        sendPageloadEvent('CUSTOMER_BUREAU_OFFER_AVAILABLE', formData);
      }, 1000);
      break;
    }

    case 'get this card': {
      digitalData.page.pageInfo.pageName = PAGE_NAME[eventType];
      digitalData.card = {
        selectedCard: formData?.form?.productCode,
        annualFee: formData?.form?.joiningandRenewalFee,
      };
      // digitalData.event = {
      //   status: formData.cardBenefitsAgreeCheckbox,
      // };
      currentFormContext.action = 'confirmation';
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }

    case 'address continue': {
      // formData?.queryParams?.authmode
      // const formData = globals.functions.exportData();
      // const idcomVisit = formData?.queryParams?.authmode; // "DebitCard"
      digitalData.page.pageInfo.pageName = PAGE_NAME[eventType];
      digitalData.event = {
        status: formData?.form?.cardDeliveryAddressOption1 || formData?.form?.cardDeliveryAddressOption2,
        validationMethod: '', // Netbanking or Debit card - validationMethod - authmode will be getting only after idcom redirected - how to use that value
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }

    case 'kyc continue': {
      digitalData.page.pageInfo.pageName = PAGE_NAME[eventType];
      const kyc = (formData?.form?.aadharEKYCVerification && 'Ekyc') || (formData?.form?.aadharBiometricVerification && 'Biometric') || (formData?.form?.officiallyValidDocumentsMethod && 'Other Docs');
      digitalData.formDetails = {
        KYCVerificationMethod: kyc,
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }

    case 'i agree': {
      digitalData.page.pageInfo.pageName = PAGE_NAME[eventType];
      digitalData.formDetails = {
        languageSelected: currentFormContext?.languageSelected,
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }

    case 'aadhaar otp': {
      digitalData.page.pageInfo.pageName = PAGE_NAME[eventType];
      // UID OR VID  how to capture the value - aadhar in different portal.
      digitalData.event = {
        status: '',
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }

    case 'document upload continue': {
      digitalData.page.pageInfo.pageName = PAGE_NAME[eventType];
      digitalData.formDetails = {
        documentProof: formData?.docUploadDropdown, // documentType
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }

    case 'start kyc': {
      digitalData.page.pageInfo.pageName = PAGE_NAME[eventType];
      // ETB_ Capture clicks on Start vKYC CTA, Applicable only for ETB Address Change, Only in case of Aadhaar and Application no. mismatch
      // NTB_ '1'(default without any condition)
      digitalData.event = {
        status: '1', // formData?.vkycProceedButton, //  value is '1' or '0' for -e63 capture
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('submit');
      break;
    }

    case 'submit review': {
      // common both ntb + etb
      digitalData.page.pageInfo.pageName = PAGE_NAME[eventType];
      digitalData.event = {
        rating: formData?.ratingvalue,
      };
      if (window) {
        window.digitalData = digitalData || {};
      }
      _satellite.track('survey');
      break;
    }
    default:
      // do nothing
  }
  // window.digitalData = digitalData || {};
}

function populateResponse(payload, eventType, digitalData) {
  switch (eventType) {
    case 'otp click': {
      digitalData.page.pageInfo.errorCode = payload?.status?.errorCode;
      digitalData.page.pageInfo.errorMessage = payload?.status?.errorMessage;
      break;
    }
    case 'check offers':
    case 'i agree':
    case 'document upload continue':
    case 'aadhaar otp':
    case 'kyc continue':
    case 'get this card':
    case 'submit review':
    case 'address continue':
    case 'start kyc': {
      digitalData.page.pageInfo.errorCode = payload?.errorCode;
      digitalData.page.pageInfo.errorMessage = payload?.errorMessage;
      break;
    }
    default:
    // do nothing
  }
}

/**
 * Send analytics events.
 * @param {string} eventType
 * @param {object} payload
 * @param {string} journeyState
 * @param {object} formData
 * @param {object} currentFormContext
 */
function sendAnalyticsEvent(eventType, payload, journeyState, formData) {
  const digitalData = createDeepCopyFromBlueprint(ANALYTICS_CLICK_OBJECT);
  const attributes = data[eventType];
  populateResponse(payload, eventType, digitalData);
  sendSubmitClickEvent(formData?.login?.registeredMobileNumber, eventType, attributes?.linkType, formData, journeyState, digitalData);
}

/**
* sendErrorAnalytics
* @param {string} errorCode
* @param {string} errorMsg
* @param {string} journeyState
* @param {object} globals
*/
function sendErrorAnalytics(errorCode, errorMsg, journeyState, globals) {
  const digitalData = createDeepCopyFromBlueprint(ANALYTICS_PAGE_LOAD_OBJECT);
  setAnalyticPageLoadProps(journeyState, santizedFormDataWithContext(globals), digitalData);
  digitalData.page.pageInfo.errorCode = errorCode;
  digitalData.page.pageInfo.errorMessage = errorMsg;
  if (window) {
    window.digitalData = digitalData || {};
  }
  _satellite.track('pageload');
}

/**
* sendAnalytics
* @param {string} eventType
* @param {string} payload
* @param {string} journeyState
* @param {object} globals
*/
function sendAnalytics(eventType, payload, journeyState, globals) {
  const formData = santizedFormDataWithContext(globals);
  if (eventType === 'page load') {
    sendPageloadEvent(journeyState, formData);
  } else {
    sendAnalyticsEvent(eventType, payload, journeyState, formData);
  }
}

/**
 * Sends an analytics event and performs additional asynchronous operations.
 *
 * @param {string} eventType - The type of the event to be sent.
 * @param {string} payload - The data to be sent with the event.
 * @param {string} journeyState - The state of the current journey.
 * @param {Object} globals - Global context or data required for the event.
 * @returns {Promise<object>} A promise that resolves with 'Success' if the operation is successful, or rejects with an error.
 */
function asyncAnalytics(eventType, payload, journeyState, globals) {
  return new Promise((resolve) => {
    try {
      sendAnalyticsEvent(eventType, payload, journeyState, santizedFormDataWithContext(globals));
      setTimeout(() => resolve({ response: 'success' }), 2000);
    } catch (ex) {
      console.log(ex);
    }
  });
}

export {
  sendPageloadEvent,
  sendAnalyticsEvent,
  sendErrorAnalytics,
  sendAnalytics,
  asyncAnalytics,
};
