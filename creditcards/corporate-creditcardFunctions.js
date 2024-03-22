/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import createJourneyId from '../common/journey-utils.js';
import {
  formUtil, maskNumber, urlPath, clearString, getTimeStamp, convertDateToMmmDdYyyy, setDataAttributeOnClosestAncestor,
} from '../common/formutils.js';

const journeyName = 'CORPORATE_CREDIT_CARD';
const currentFormContext = {
  journeyID: createJourneyId('a', 'b', 'c'),
  journeyName,
};
let resendOtpCount = 3;
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
 * Handles the success scenario for OTP generation.
 * @param {any} res  - The response object containing the OTP success generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpGenSuccess = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.welcomeTextLabel,
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

  const panWizardField = formUtil(globals, pannel.panWizardField);
  const dobWizardField = formUtil(globals, pannel.dobWizardField);
  const currentAddressNTB = formUtil(globals, pannel.currentAddressNTB);
  const currentAddressETB = formUtil(globals, pannel.currentAddressETB);

  welcomeTxt.visible(false);
  otpBtn.visible(false);
  loginPanel.visible(false);
  otpPanel.visible(true);

  appendMaskedNumber('field-otphelptext', regMobNo);
};

/**
 * Handles the failure scenario for OTP generation.
 * @param {any} res  - The response object containing the OTP failure generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpGenFailure = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.welcomeTextLabel,
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
};

const OTPGEN = {
  getPayload(globals) {
    const mobileNo = globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value;
    const panNo = globals.form.loginPanel.identifierPanel.pan.$value;
    const dob = clearString(globals.form.loginPanel.identifierPanel.dateOfBirth.$value);
    const jsonObj = {};
    jsonObj.requestString = {};
    jsonObj.requestString.mobileNumber = String(mobileNo) ?? '';
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
 * Automatically fills form fields based on response data.
 * @param {object} res - The response data object.
 * @param {object} globals - Global variables object.
 * @param {object} panel - Panel object.
 */
const personalDetailsPreFillFromBRE = (res, globals, panel) => {
  const changeDataAttrObj = { attrChange: true, value: false };
  // Extract personal details from globals
  const personalDetails = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails;

  // Extract breCheckAndFetchDemogResponse from res
  const breCheckAndFetchDemogResponse = res?.demogResponse?.BRECheckAndFetchDemogResponse;

  if (!breCheckAndFetchDemogResponse) return;

  // Extract gender from response
  const custGender = breCheckAndFetchDemogResponse?.VDCUSTGENDER;
  const gender = formUtil(globals, personalDetails.gender);
  gender.setValue(custGender, changeDataAttrObj);

  // Extract name from response
  const { VDCUSTFULLNAME: fullName } = breCheckAndFetchDemogResponse || {};
  const [custFirstName, ...remainingName] = fullName.split(' ');
  const custLastName = remainingName.pop() || '';
  const custMiddleName = remainingName.join(' ');
  const firstName = formUtil(globals, personalDetails.firstName);
  firstName.setValue(custFirstName, changeDataAttrObj);
  const lastName = formUtil(globals, personalDetails.lastName);
  lastName.setValue(custLastName, changeDataAttrObj);
  const middleName = formUtil(globals, personalDetails.middleName);
  middleName.setValue(custMiddleName, changeDataAttrObj);

  // Extract date of birth or ITNBR
  // const custDate = panel.login.pan.$value ? breCheckAndFetchDemogResponse?.DDCUSTDATEOFBIRTH : breCheckAndFetchDemogResponse?.VDCUSTITNBR;
  // globals.functions.setProperty(personalDetails.dobPersonalDetails, { value: panel.login.pan.$value ? convertDateToMmmDdYyyy(custDate.toString()) : custDate });
  const custDate = breCheckAndFetchDemogResponse?.DDCUSTDATEOFBIRTH;
  const dobPersonalDetails = formUtil(globals, personalDetails.dobPersonalDetails);
  dobPersonalDetails.setValue(convertDateToMmmDdYyyy(custDate?.toString()));

  // Create address string and set it to form field
  const completeAddress = [
    breCheckAndFetchDemogResponse?.VDCUSTADD1,
    breCheckAndFetchDemogResponse?.VDCUSTADD2,
    breCheckAndFetchDemogResponse?.VDCUSTADD3,
    breCheckAndFetchDemogResponse?.VDCUSTCITY,
    breCheckAndFetchDemogResponse?.VDCUSTSTATE,
    breCheckAndFetchDemogResponse?.VDCUSTZIPCODE,
  ].filter(Boolean).join(', ');
  const prefilledCurrentAdddress = formUtil(globals, globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressETB.prefilledCurrentAdddress);
  prefilledCurrentAdddress.setValue(completeAddress);
};

/**
 * Handles the success scenario for OTP Validation.
 * @param {any} res  - The response object containing the OTP success generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpValSuccess = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.welcomeTextLabel,
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
  if (currentFormContext.existingCustomer === 'Y') {
    personalDetailsPreFillFromBRE(res, globals, pannel);
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
    welcome: globals.form.welcomeTextLabel,
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
  // const ccWizardPannel = formUtil(globals, pannel.ccWizardView);
  const resultPanel = formUtil(globals, pannel.resultPanel);

  welcomeTxt.visible(false);
  otpBtn.visible(false);
  loginPanel.visible(false);
  otpPanel.visible(false);
  // ccWizardPannel.visible(true);

  (async () => {
    const myImportedModule = await import('./cc.js');
    myImportedModule.onWizardInit();
  })();
  resultPanel.visible(true);
};

const OTPVAL = {
  getPayload(globals) {
    const mobileNo = globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value;
    const panNo = globals.form.loginPanel.identifierPanel.pan.$value;
    const passwordValue = globals.form.otpPanel.otpNumber.$value;
    const dob = clearString(globals.form.loginPanel.identifierPanel.dateOfBirth.$value);
    const jsonObj = {};
    jsonObj.requestString = {};
    jsonObj.requestString.mobileNumber = String(mobileNo) ?? '';
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
    return (res?.demogResponse?.errorCode === '0') ? otpValSuccess(res, globals) : otpValFailure(res, globals);
  },
  errorCallback(err, globals) {
    otpValFailure(err, globals);
    console.log(`I am in errorCallback_OtpFailure ${globals}`);
  },
  path: urlPath('/content/hdfc_cc_unified/api/otpValFetchAssetDemog.json'),
  loadingText: 'Please wait while we are authenticating you',
};

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
export { OTPGEN, OTPVAL, RESENDOTP };
