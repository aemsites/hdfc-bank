/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/* eslint no-unused-vars: ["error", { "args": "none" }] */
import createJourneyId from '../common/journey-utils.js';
import PANValidationAndNameMatchService from '../common/panvalidation.js';
import executeCheck from '../common/panutils.js';
import customerValidationHandler from '../common/executeinterfaceutils.js';
import {
  formUtil,
  maskNumber,
  urlPath,
  clearString,
  getTimeStamp,
  convertDateToMmmDdYyyy,
  setDataAttributeOnClosestAncestor,
  convertDateToDdMmYyyy,
  santizedFormData,
} from '../common/formutils.js';
import { getJsonResponse } from '../common/makeRestAPI.js';

const journeyName = 'CORPORATE_CARD_JOURNEY';
const currentFormContext = {
  journeyID: createJourneyId('a', 'b', 'c'),
  journeyName,
};
let PAN_VALIDATION_STATUS = false;
let PAN_RETRY_COUNTER = 1;
let resendOtpCount = 3;
let IS_ETB_USER = false;
const CUSTOMER_INPUT = { mobileNumber: '', pan: '', dob: '' };
const CUSTOMER_DEMOG_DATA = {};
/**
 * Appends a masked number to the specified container element if the masked number is not present.
 * @param {String} containerClass - The class name of the container element.
 * @param {String} number - The number to be masked and appended to the container element.
 * @returns {void}
 */
const appendMaskedNumber = (containerClass, number) => {
  const otpHelpText = document.getElementsByClassName(containerClass)?.[0];
  const pElement = otpHelpText?.querySelector('p');
  const nestedPElement = pElement?.querySelector('p');
  const maskedNo = `${maskNumber(number, 6)}.`;
  const newText = document.createTextNode(maskedNo);
  if (!nestedPElement?.textContent?.includes(maskedNo)) {
    nestedPElement?.appendChild(newText);
  }
};

/**
 * Changes the text content of a <p> element inside a pannel with the specified name.
 * @param {String} pannelName - The name of the panel containing the <p> element.
 * @param {String} innerContent - The new text content to set for the <p> element.
 */
const changeTextContent = (pannelName, innerContent) => {
  const panel = document.getElementsByName(pannelName)?.[0];
  if (panel) {
    const pElement = panel.querySelector('p');
    const nestedPElement = pElement?.querySelector('p');
    if (nestedPElement) {
      nestedPElement.textContent = innerContent;
    }
  }
};

/**
 * removebanner from the landing screen by settin the display property to 'none' to remove the banner
 */
const removeBanner = () => {
  const banner = document.querySelector('.cmp-container-container');
  if (banner) {
    banner.style.display = 'none';
  }
};

/**
  * Decorates the password input to hide the text and display only bullets
  * @name decoratePasswordField Runs after user clicks on Get OTP
  */
function decoratePwdField() {
  const pwdInput = document.querySelector('main .form .field-otppanel .field-otpnumber input');
  pwdInput.type = 'password';
}

/**
 * invokeJourneyApiCall to log on success and error call backs of api calls.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const invokeJourneyApiCall = async (globals) => {
  const journeyJSONObj = {
    RequestPayload: {
      userAgent: window.navigator.userAgent,
      leadProfile: {},
      formData: {
        channel: 'ADOBE WEBFORMS',
        journeyName: currentFormContext.journeyName,
        journeyID: currentFormContext.journeyID,
        journeyStateInfo: [
          {
            state: 'CUSTOMER_IDENTITY_ACQUIRED',
            stateInfo: JSON.stringify(santizedFormData(globals)),
            timeinfo: new Date().toISOString(),
          },
          {
            state: 'CUSTOMER_IDENTITY_UNRESOLVED',
            stateInfo: JSON.stringify(santizedFormData(globals)),
            timeinfo: new Date().toISOString(),
          },
        ],
      },
    },
  };
  const url = 'https://applyonlinedev.hdfcbank.com/content/hdfc_commonforms/api/journeydropoff.json';
  const method = 'POST';
  try {
    const jsonApiCall = await getJsonResponse(url, journeyJSONObj, method);
    // success method proceed
    console.log(jsonApiCall, 'journeyapicall_response');
  } catch (error) {
    // error method proceed
    console.error(error);
  }
};

/**
 * Handles the success scenario for OTP generation.
 * @param {any} res  - The response object containing the OTP success generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpGenSuccess = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.loginPanel.welcomeTextLabel,
    login: globals.form.loginPanel,
    otp: globals.form.otpPanel,
    otpButton: globals.form.getOTPbutton,
    currentAddressNTB: globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressNTB,
    currentAddressETB: globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressETB,
    panWizardField: globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.dobPersonalDetails,
    dobWizardField: globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.panNumberPersonalDetails,
  };
  currentFormContext.isCustomerIdentified = res?.customerIdentificationResponse?.CustomerIdentificationResponse?.errorCode === '0' ? 'Y' : 'N';
  const welcomeTxt = formUtil(globals, pannel.welcome);
  const otpPanel = formUtil(globals, pannel.otp);
  const otpBtn = formUtil(globals, pannel.otpButton);
  const loginPanel = formUtil(globals, pannel.login);
  const regMobNo = pannel.login.mobilePanel.registeredMobileNumber.$value;

  welcomeTxt.visible(false);
  otpBtn.visible(false);
  loginPanel.visible(false);
  otpPanel.visible(true);

  appendMaskedNumber('field-otphelptext', regMobNo);
  decoratePwdField();
  removeBanner();
  invokeJourneyApiCall(globals);
};

/**
 * Handles the failure scenario for OTP generation.
 * @param {any} res  - The response object containing the OTP failure generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpGenFailure = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.loginPanel.welcomeTextLabel,
    login: globals.form.loginPanel,
    otp: globals.form.otpPanel,
    otpButton: globals.form.getOTPbutton,
    resultPanel: globals.form.resultPanel,
  };

  const welcomeTxt = formUtil(globals, pannel.welcome);
  const otpPanel = formUtil(globals, pannel.otp);
  const loginPanel = formUtil(globals, pannel.login);
  const otpBtn = formUtil(globals, pannel.otpButton);
  const failurePanel = formUtil(globals, pannel.resultPanel);

  welcomeTxt.visible(false);
  otpPanel.visible(false);
  loginPanel.visible(false);
  otpBtn.visible(false);
  failurePanel.visible(true);
  removeBanner();
  invokeJourneyApiCall(globals);
};

const OTPGEN = {
  getPayload(globals) {
    const mobileNo = globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value;
    const panNo = globals.form.loginPanel.identifierPanel.pan.$value;
    const dob = clearString(globals.form.loginPanel.identifierPanel.dateOfBirth.$value);
    const jsonObj = {};
    jsonObj.requestString = {};
    jsonObj.requestString.mobileNumber = String(mobileNo);
    jsonObj.requestString.dateOfBith = dob ?? '';
    jsonObj.requestString.panNumber = panNo ?? '';
    jsonObj.requestString.journeyID = currentFormContext.journeyID;
    jsonObj.requestString.journeyName = currentFormContext.journeyName;
    jsonObj.requestString.userAgent = window.navigator.userAgent;
    jsonObj.requestString.identifierValue = panNo || dob;
    jsonObj.requestString.identifierName = panNo ? 'PAN' : 'DOB';
    return jsonObj;
  },
  successCallback(res, globals) {
    return (res?.otpGenResponse?.status?.errorCode === '0') ? otpGenSuccess(res, globals) : otpGenFailure(res, globals);
  },
  errorCallback(err, globals) {
    otpGenFailure(err, globals);
    console.log(`I am in errorCallbackOtpGen ${globals}`);
  },
  path: urlPath('/content/hdfc_ccforms/api/customeridentificationV4.json'),
  loadingText: 'Please wait while we are authenticating you',
};

/**
 * Adds the 'wrapper-disabled' class to the parent elements of inputs or selects within the given panel
 * if their values are truthy.
 * @param {HTMLElement} selectedPanel - The panel element containing the inputs or selects.
 */
const addDisableClass = (selectedPanel) => {
  const panelInputs = Array.from(selectedPanel.querySelectorAll('input, select'));

  // Iterates over each input or select element
  panelInputs.forEach((panelInput) => {
    // Checks if the input or select element has a truthy value
    if (panelInput.value || panelInput.name === 'middleName') {
      // Adds the 'wrapper-disabled' class to the parent element
      panelInput.parentElement.classList.add('wrapper-disabled');
    }
  });
};

/**
 * Parses the given address into substrings, each containing up to 30 characters.
 * @param {string} address - The address to parse.
 * @returns {string[]} An array of substrings, each containing up to 30 characters.
 */
const parseCustomerAddress = (address) => {
  const words = address.trim().split(' ');
  const substrings = [];
  let currentSubstring = '';

  words.forEach((word) => {
    if (substrings.length === 3) {
      return; // Exit the loop if substrings length is equal to 3
    }
    if ((`${currentSubstring} ${word}`).length <= 30) {
      currentSubstring += (currentSubstring === '' ? '' : ' ') + word;
    } else {
      substrings.push(currentSubstring);
      currentSubstring = word;
    }
  });

  return substrings;
};

/**
 * Sanitizes the name for special characters.
 * @param {String} name - The name token.
 * @returns {String} sanitized name.
 */
const sanitizeName = (name) => name.replace(/[^a-zA-Z]/g, '');

/**
 * Splits a full name into its components: first name, middle name, and last name.
 *
 * @param {string} fullName - The full name to split.
 * @returns {Object} An object containing the first name, middle name, and last name.
 * @property {string} firstName - The first name extracted from the full name.
 * @property {string} middleName - The middle name extracted from the full name.
 * @property {string} lastName - The last name extracted from the full name.
 */
const splitName = (fullName) => {
  const name = { firstName: '', middleName: '', lastName: '' };
  if (fullName) {
    const parts = fullName.split(' ');
    name.firstName = sanitizeName(parts.shift()) || '';
    name.lastName = sanitizeName(parts.pop()) || '';
    name.middleName = parts.length > 0 ? sanitizeName(parts[0]) : '';
  }
  return name;
};

/* Automatically fills form fields based on response data.
 * @param {object} res - The response data object.
 * @param {object} globals - Global variables object.
 * @param {object} panel - Panel object.
 */
const personalDetailsPreFillFromBRE = (res, globals) => {
  const changeDataAttrObj = { attrChange: true, value: false };
  // Extract personal details from globals
  const personalDetails = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails;
  const currentAddressNTB = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressNTB;
  const currentAddressETB = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressETB;
  const currentAddressNTBUtil = formUtil(globals, currentAddressNTB);
  currentAddressNTBUtil.visible(false);
  // Extract breCheckAndFetchDemogResponse from res
  const breCheckAndFetchDemogResponse = res?.demogResponse?.BRECheckAndFetchDemogResponse;

  if (!breCheckAndFetchDemogResponse) return;

  // Extract gender from response
  const personalDetailsFields = {
    gender: 'VDCUSTGENDER',
    personalEmailAddress: 'VDCUSTEMAILADD',
    panNumberPersonalDetails: 'VDCUSTITNBR',
  };
  Object.entries(personalDetailsFields).forEach(([field, key]) => {
    const value = breCheckAndFetchDemogResponse[key]?.split(' ')?.[0];
    CUSTOMER_DEMOG_DATA[field] = value;
    if (value !== undefined && value !== null) {
      const formField = formUtil(globals, personalDetails[field]);
      formField.setValue(value, changeDataAttrObj);
    }
  });

  const name = splitName(breCheckAndFetchDemogResponse?.VDCUSTFULLNAME);
  // Set name fields
  Object.entries(name).forEach(([field, key]) => {
    const formField = formUtil(globals, personalDetails[field]);
    formField.setValue(key, changeDataAttrObj);
  });

  const custDate = breCheckAndFetchDemogResponse?.DDCUSTDATEOFBIRTH;
  if (custDate) {
    const dobField = document.getElementsByName('dobPersonalDetails')?.[0];
    CUSTOMER_DEMOG_DATA.dobPersonalDetails = custDate;
    if (dobField) {
      // If the input field exists, change its type to 'text' to display date
      dobField.type = 'text';
    }
    const dobPersonalDetails = formUtil(globals, personalDetails.dobPersonalDetails);
    dobPersonalDetails.setValue(convertDateToMmmDdYyyy(custDate.toString()));
  }

  // Create address string and set it to form field
  const completeAddress = [
    breCheckAndFetchDemogResponse?.VDCUSTADD1,
    breCheckAndFetchDemogResponse?.VDCUSTADD2,
    breCheckAndFetchDemogResponse?.VDCUSTADD3,
    breCheckAndFetchDemogResponse?.VDCUSTCITY,
    breCheckAndFetchDemogResponse?.VDCUSTSTATE,
    breCheckAndFetchDemogResponse?.VDCUSTZIPCODE,
  ].filter(Boolean).join(', ');
  const prefilledCurrentAdddress = formUtil(globals, currentAddressETB.prefilledCurrentAdddress);
  prefilledCurrentAdddress.setValue(completeAddress);
  const currentAddressETBUtil = formUtil(globals, currentAddressETB);
  currentAddressETBUtil.visible(true);
  const personaldetails = document.querySelector('.field-personaldetails');
  personaldetails.classList.add('personaldetails-disabled');
  addDisableClass(personaldetails);
  const customerFiller2 = breCheckAndFetchDemogResponse?.BREFILLER2?.toUpperCase();
  if (customerFiller2 === 'D106') {
    const customerValidAddress = parseCustomerAddress(`${breCheckAndFetchDemogResponse?.VDCUSTADD1} ${breCheckAndFetchDemogResponse?.VDCUSTADD2} ${breCheckAndFetchDemogResponse?.VDCUSTADD3}`);
  }
};

/**
 * Checks if a customer is an existing customer based on specific criteria.
 * @param {Object} res - The response object containing customer information.
 * @returns {boolean|null} Returns true if the customer is an existing customer,
 * false if not, and null if the criteria are not met or the information is incomplete.
 */
const existingCustomerCheck = (res) => {
  // Mapping of customer segments to categories
  const customerCategory = {
    only_casa: 'ETB',
    only_cc: 'ETB',
    only_asset: 'NTB',
    only_hl: 'NTB',
    casa_cc: 'ETB',
    casa_asset_cc: 'ETB',
    cc_casa: 'ETB',
    cc_asset: 'ETB',
  };

  // Extract customer information
  const customerInfo = res?.demogResponse?.BRECheckAndFetchDemogResponse;
  const customerFiller2 = customerInfo?.BREFILLER2?.toUpperCase();

  // Handle specific cases
  if (customerFiller2 === 'D102') {
    // Case where customerFiller2 is 'D102'
    return false;
  }
  if (customerFiller2 === 'D101' || customerFiller2 === 'D106') {
    // Case where customerFiller2 is 'D101' or 'D106'
    const segment = customerInfo?.SEGMENT?.toLowerCase();
    const customerType = customerCategory[segment];

    // Check customer type and return accordingly
    return customerType === 'ETB';
  }

  // Default case
  return null;
};

/**
 * Handles the success scenario for OTP Validation.
 * @param {any} res  - The response object containing the OTP success generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpValSuccess = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.loginPanel.welcomeTextLabel,
    login: globals.form.loginPanel,
    otp: globals.form.otpPanel,
    otpButton: globals.form.getOTPbutton,
    ccWizardView: globals.form.corporateCardWizardView,
    resultPanel: globals.form.resultPanel,
  };
  currentFormContext.isCustomerIdentified = res?.customerIdentificationResponse?.CustomerIdentificationResponse?.errorCode === '0' ? 'Y' : 'N';
  const welcomeTxt = formUtil(globals, pannel.welcome);
  const otpPanel = formUtil(globals, pannel.otp);
  const otpBtn = formUtil(globals, pannel.otpButton);
  const loginPanel = formUtil(globals, pannel.login);
  const ccWizardPannel = formUtil(globals, pannel.ccWizardView);

  welcomeTxt.visible(false);
  otpBtn.visible(false);
  loginPanel.visible(false);
  otpPanel.visible(false);
  ccWizardPannel.visible(true);
  CUSTOMER_INPUT.mobileNumber = pannel.login.mobilePanel.registeredMobileNumber.$value;
  CUSTOMER_INPUT.dob = pannel.login.identifierPanel.dateOfBirth.$value;
  CUSTOMER_INPUT.pan = pannel.login.identifierPanel.pan.$value;
  const existingCustomer = existingCustomerCheck(res);
  if (existingCustomer) {
    IS_ETB_USER = true;
    personalDetailsPreFillFromBRE(res, globals);
  }
  (async () => {
    const myImportedModule = await import('./cc.js');
    myImportedModule.onWizardInit();
  })();
};

/**
 * Handles the failure scenario for OTP Validation.
 * @param {any} res  - The response object containing the OTP success generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpValFailure = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.loginPanel.welcomeTextLabel,
    login: globals.form.loginPanel,
    otp: globals.form.otpPanel,
    otpButton: globals.form.getOTPbutton,
    ccWizardView: globals.form.corporateCardWizardView,
    resultPanel: globals.form.resultPanel,
    incorrectOtpText: globals.form.incorrectOTPText,
    errorPanelLabel: globals.form.resultPanel.errorResultPanel,
  };
  currentFormContext.isCustomerIdentified = res?.customerIdentificationResponse?.CustomerIdentificationResponse?.errorCode === '0' ? 'Y' : 'N';
  const welcomeTxt = formUtil(globals, pannel.welcome);
  const otpPanel = formUtil(globals, pannel.otp);
  const otpBtn = formUtil(globals, pannel.otpButton);
  const loginPanel = formUtil(globals, pannel.login);
  const resultPanel = formUtil(globals, pannel.resultPanel);
  const incorectOtp = formUtil(globals, pannel.incorrectOtpText);
  const otpNumFormName = 'otpNumber';// constantName-otpNumberfieldName
  const otpFieldinp = formUtil(globals, pannel.otp?.[`${otpNumFormName}`]);
  const resultSetErrorText1 = formUtil(globals, pannel.errorPanelLabel.resultSetErrorText1);
  const resultSetErrorText2 = formUtil(globals, pannel.errorPanelLabel.resultSetErrorText2);
  const tryAgainButtonErrorPanel = formUtil(globals, pannel.errorPanelLabel.tryAgainButtonErrorPanel);
  /* startCode- switchCase otp-error-scenarios- */
  switch (res?.otpValidationResponse?.errorCode) {
    case '02': { // incorrect otp
      otpFieldinp.setValue('');
      incorectOtp.visible(true);
      const otpNumbrQry = document.getElementsByName(otpNumFormName)?.[0];
      otpNumbrQry?.addEventListener('input', (e) => {
        if (e.target.value) {
          incorectOtp.visible(false);
        }
      });
      break;
    }
    case '04': { // incorrect otp attempt of 3 times.
      incorectOtp.visible(false);
      welcomeTxt.visible(false);
      otpBtn.visible(false);
      loginPanel.visible(false);
      otpPanel.visible(false);
      resultPanel.visible(true);
      const errorText = 'You have entered invalid OTP for 3 consecutive attempts. Please try again later';
      const errorTextPannelName = 'errorResultPanel';
      changeTextContent(errorTextPannelName, errorText);
      resultSetErrorText1.visible(false);
      resultSetErrorText2.visible(false);
      tryAgainButtonErrorPanel.visible(true);
      const reloadBtn = document.getElementsByName('tryAgainButtonErrorPanel')?.[0];
      reloadBtn.addEventListener('click', () => window.location.reload());
      break;
    }
    case 'CZ_HTTP_0003': { // // Unfortunately, we were unable to process your request - happens when value is empty.
      incorectOtp.visible(false);
      welcomeTxt.visible(false);
      otpBtn.visible(false);
      loginPanel.visible(false);
      otpPanel.visible(false);
      resultPanel.visible(true);
      const errorText = 'Unfortunately, we were unable to process your request';
      const errorTextPannelName = 'errorResultPanel';
      changeTextContent(errorTextPannelName, errorText);
      resultSetErrorText1.visible(false);
      resultSetErrorText2.visible(false);
      break;
    }
    default: {
      incorectOtp.visible(false);
      welcomeTxt.visible(false);
      otpBtn.visible(false);
      loginPanel.visible(false);
      otpPanel.visible(false);
      resultPanel.visible(true);
    }
  }
  /* endCode- switchCase otp-error-scenarios- */
};

const OTPVAL = {
  getPayload(globals) {
    const mobileNo = globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value;
    const panNo = globals.form.loginPanel.identifierPanel.pan.$value;
    const passwordValue = globals.form.otpPanel.otpNumber.$value;
    const dob = clearString(globals.form.loginPanel.identifierPanel.dateOfBirth.$value);
    const jsonObj = {};
    jsonObj.requestString = {};
    jsonObj.requestString.mobileNumber = String(mobileNo);
    jsonObj.requestString.panNumber = String(panNo) ?? '';
    jsonObj.requestString.dateOfBirth = String(dob) ?? '';
    jsonObj.requestString.channelSource = '';
    jsonObj.requestString.dedupeFlag = 'N';
    jsonObj.requestString.passwordValue = String(passwordValue) ?? '';
    jsonObj.requestString.referenceNumber = `AD${getTimeStamp(new Date())}` ?? '';
    jsonObj.requestString.journeyID = currentFormContext.journeyID;
    jsonObj.requestString.journeyName = currentFormContext.journeyName;
    jsonObj.requestString.userAgent = window.navigator.userAgent;
    jsonObj.requestString.existingCustomer = currentFormContext.isCustomerIdentified ?? '';
    return jsonObj;
  },
  successCallback(res, globals) {
    return ((res?.demogResponse?.errorCode === '0') && (res?.otpValidationResponse?.errorCode === '0')) ? otpValSuccess(res, globals) : otpValFailure(res, globals);
  },
  errorCallback(err, globals) {
    otpValFailure(err, globals);
    console.log(`I am in errorCallback_OtpFailure ${globals}`);
  },
  path: urlPath('/content/hdfc_cc_unified/api/otpValFetchAssetDemog.json'),
  loadingText: 'Please wait while we are authenticating you',
};

/**
 * Moves the corporate card wizard view from one step to the next step.
 * @param {String} source - The name attribute of the source element (parent wizard panel).
 * @param {String} target - The name attribute of the destination element.
 */
const moveCCWizardView = (source, target) => {
  const navigateFrom = document.getElementsByName(source)?.[0];
  const current = navigateFrom?.querySelector('.current-wizard-step');
  const currentMenuItem = navigateFrom?.querySelector('.wizard-menu-active-item');
  const navigateTo = document.getElementsByName(target)?.[0];
  current?.classList?.remove('current-wizard-step');
  navigateTo?.classList?.add('current-wizard-step');
  // add/remove active class from menu item
  const navigateToMenuItem = navigateFrom?.querySelector(`li[data-index="${navigateTo?.dataset?.index}"]`);
  currentMenuItem?.classList?.remove('wizard-menu-active-item');
  navigateToMenuItem?.classList?.add('wizard-menu-active-item');
  const event = new CustomEvent('wizard:navigate', {
    detail: {
      prevStep: { id: current?.id, index: parseInt(current?.dataset?.index || 0, 10) },
      currStep: { id: navigateTo?.id, index: parseInt(navigateTo?.dataset?.index || 0, 10) },
    },
    bubbles: false,
  });
  navigateFrom?.dispatchEvent(event);
};

/**
 * Handles the success scenario on check offer.
 * @param {any} res - The response object containing the check offer success response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const checkOfferSuccess = (res, globals) => moveCCWizardView('corporateCardWizardView', 'confirmCardPanel');

/**
 * Handles the failure scenario on check offer.
 * @param {any} err - The response object containing the check offer failure response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const checkOfferFailure = (err, globals) => moveCCWizardView('corporateCardWizardView', 'confirmCardPanel');

const CHECKOFFER = {
  getPayload(globals) {
    const mobileNo = globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value;
    const jsonObj = {};
    jsonObj.requestString = {};
    jsonObj.requestString.mobileNumber = String(mobileNo);
    return jsonObj;
  },
  successCallback(res, globals) {
    return checkOfferSuccess(res, globals);
  },
  errorCallback(err, globals) {
    return checkOfferFailure(err, globals);
  },
  path: urlPath('/content/hdfc_cc_unified/api/checkoffer.json'),
  loadingText: 'Checking offers for you...',
};

/**
 * Moves the wizard view to the "selectKycPaymentPanel" step.
 */
const getThisCard = () => moveCCWizardView('corporateCardWizardView', 'selectKycPaymentPanel');

/**
 * Moves the wizard view to the "confirmAndSubmitPanel" step.
 */
const getAddressDetails = () => moveCCWizardView('corporateCardWizardView', 'confirmAndSubmitPanel');

/**
 * Resends OTP success handler.
 * @param {any} res  - The response object containing the OTP success generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const resendOtpSuccess = (res, globals) => {
  const pannel = globals.form.otpPanel;
  const resendBtn = formUtil(globals, pannel.otpResend);
  const maxAttemptText = formUtil(globals, pannel.maxAttemptText);
  OTPGEN.successCallback(res, globals);
  resendOtpCount -= 1;
  const existCountString = 3;
  const attemptLeft = pannel.maxAttemptText.$value?.replace(/\d\/\d|\d/, `${resendOtpCount}/${existCountString}`);
  maxAttemptText.setValue(attemptLeft);
  if (!resendOtpCount) {
    // resendBtn.enabled(false); // disabling functionality button willl exist in DOM
    resendBtn.visible(false); // button will not exist in DOM
    const errMsg = document.querySelector('.field-maxattempttext');
    errMsg.classList.remove('col-6');
    errMsg.classList.add('col-12');
  }
};

const RESENDOTP = {
  getPayload(globals) {
    return OTPGEN.getPayload(globals);
  },
  successCallback(res, globals) {
    return resendOtpSuccess(res, globals);
  },
  errorCallback(err, globals) {
    return OTPGEN.errorCallback(err, globals);
  },
  path: OTPGEN.path,
  loadingText: 'Please wait otp sending again...',
};

/**
 * Enables a form field by removing the 'wrapper-disabled' class and adding the 'error-field' class.
 *
 * @param {string} elementClassName - The class name of the form field element to enable.
 * @returns {void}
 */
const enableFormField = (elementClassName) => {
  const selectedElem = document.querySelector(`.${elementClassName}`);
  selectedElem.classList.remove('wrapper-disabled');
  selectedElem.classList.add('error-field');
};

/**
 * Checks the demog data of a customer for PAN details and last name.
 *
 * @param {string} panStatus - The PAN status of the customer.
 * @returns {Object} An object containing the check results.
 * @property {boolean} proceed - Indicates whether the process can proceed.
 * @property {boolean} terminationCheck - Indicates if a termination check is required.
 */
const demogDataCheck = (panStatus) => {
  const result = { proceed: false, terminationCheck: false };

  // Check if PAN number or last name is missing
  if (!CUSTOMER_DEMOG_DATA.panNumberPersonalDetails || !CUSTOMER_DEMOG_DATA.lastName) {
    if (CUSTOMER_DEMOG_DATA.panNumberPersonalDetails) {
      result.proceed = true;
    } else if (panStatus === 'E' || panStatus === 'D' || panStatus === 'X' || panStatus === 'F' || panStatus === 'ED') {
      result.terminationCheck = true;
      result.proceed = true;
    } else {
      PAN_RETRY_COUNTER += 1;
      if (PAN_RETRY_COUNTER > 3) {
        result.terminationCheck = true;
        result.proceed = true;
      } else {
        // Enable PAN form field and log retry
        enableFormField('field-pannumberpersonaldetails');
        console.log('retry');
      }
    }
  } else {
    result.proceed = true;
  }
  return result;
};

/**
 * Checks the user's proceed status based on PAN status and other conditions.
 *
 * @param {string} panStatus - The PAN status ('E', 'D', 'X', 'F', 'ED').
 * @param {Object} globals - The global object containing form and other data.
 */
const checkUserProceedStatus = (panStatus, globals) => {
  /**
   * Removes error classes from all error fields.
   */
  const errorFields = document.querySelectorAll('.error-field');
  errorFields.forEach((field) => {
    field.classList.remove('error-field');
    field.classList.add('wrapper-disabled');
  });

  /**
   * Executes the check based on PAN status.
   */
  // Main logic to check user proceed status

  let customerJourneyType = 'ETB';
  const terminationCheck = false;
  switch (IS_ETB_USER) {
    case true:
      if (CUSTOMER_INPUT.pan) {
        executeCheck(customerJourneyType, panStatus, terminationCheck, customerValidationHandler);
      } else if (CUSTOMER_INPUT.dob) {
        if (!CUSTOMER_DEMOG_DATA.panNumberPersonalDetails || !CUSTOMER_DEMOG_DATA.lastName) {
          const result = demogDataCheck(panStatus);
          if (result.proceed) {
            executeCheck(customerJourneyType, panStatus, result.terminationCheck, customerValidationHandler);
          }
        } else {
          executeCheck(customerJourneyType, panStatus, terminationCheck, customerValidationHandler);
        }
      }
      break;
    case false:
      customerJourneyType = 'NTB';
      executeCheck(customerJourneyType, panStatus, terminationCheck, customerValidationHandler);
      break;
    default:
      break;
  }
};

/**
 * Creates a PAN validation request object and handles success and failure callbacks.
 * @param {Object} globals - The global object containing necessary data for PAN validation.
 * @returns {Object} - The PAN validation request object.
 */
const createPanValidationRequest = (firstName, middleName, lastName, globals) => {
  const panValidation = {
    /**
     * Create pan validation request object.
     * @returns {Object} - The PAN validation request object.
     */
    createRequestObj: () => {
      try {
        const personalDetails = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails;
        const reqObj = {
          journeyName: currentFormContext.journeyName,
          journeyID: currentFormContext.journeyID,
          mobileNumber: globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value,
          panInfo: {
            panNumber: personalDetails.panNumberPersonalDetails.$value !== null
              ? personalDetails.panNumberPersonalDetails.$value
              : globals.form.loginPanel.identifierPanel.pan.$value,
            panType: 'P',
            dob: convertDateToDdMmYyyy(new Date(personalDetails.dobPersonalDetails.$value)),
            name: personalDetails.firstName.$value ? personalDetails.firstName.$value.split(' ')[0] : '',
          },
        };
        return reqObj;
      } catch (ex) {
        return ex;
      }
    },
    /**
     * Event handlers for PAN validation.
     */
    eventHandlers: {
      /**
       * Callback function for successful PAN validation response.
       * @param {Object} responseObj - The response object containing PAN validation result.
       */
      successCallBack: (responseObj) => {
        try {
          PAN_VALIDATION_STATUS = responseObj.panValidation.status.errorCode === '1';
          if (PAN_VALIDATION_STATUS) {
            const panStatus = responseObj.panValidation.panStatus;
            checkUserProceedStatus(panStatus, globals);
          }
        } catch (ex) {
          console.log(ex);
        }
      },
      /**
       * Callback function for failed PAN validation response.
       * @param {Object} errorObj - The error object containing details of the failure.
       */
      errorCallBack: (errorObj) => {
        console.log(errorObj);
      },
    },
  };
  // Call PANValidationAndNameMatchService with PAN validation request and event handlers
  PANValidationAndNameMatchService(panValidation.createRequestObj(), panValidation.eventHandlers);
};

/*
 * logic hanlding during prefiill of form.
 * @param {Objec} globals - The global object containing necessary globals form data.
 */

const prefillForm = (globals) => {
  const globalSchema = globals?.functions?.exportData();
  const ccGlobals = globalSchema?.data?.CorporateCreditCard;
  const ccData = {
    companyName: ccGlobals?.companyName,
    designation: ccGlobals?.designation,
    employeeCode: ccGlobals?.employeeCode,
    employmentType: ccGlobals?.employmentType,
    maskedMobileNumber: ccGlobals?.maskedMobileNumber,
    registeredMobileNumber: ccGlobals?.registeredMobileNumber,
    relationshipNumber: ccGlobals?.relationshipNumber,
    workEmailAddress: ccGlobals?.workEmailAddress,
  };
  const ccDetailsPresent = Object.values(ccData)?.every((el) => (el));
  const resultErrorPannel = formUtil(globals, globals.form.resultPanel);
  const loginPannel = formUtil(globals, globals.form.loginPanel);
  const otpButton = formUtil(globals, globals.form.getOTPbutton);
  if (!ccDetailsPresent) { // show error pannel if corporate credit card details not present
    resultErrorPannel.visible(true);
    loginPannel.visible(false);
    otpButton.visible(false);
  }
};

export {
  OTPGEN,
  OTPVAL,
  CHECKOFFER,
  RESENDOTP,
  getThisCard,
  prefillForm,
  currentFormContext,
  createPanValidationRequest,
  getAddressDetails,
};
