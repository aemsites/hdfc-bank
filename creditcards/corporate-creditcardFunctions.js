/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/* eslint no-unused-vars: ["error", { "args": "none" }] */
import createJourneyId from '../common/journey-utils.js';
import {
  formUtil, maskNumber, urlPath, clearString, getTimeStamp,
} from '../common/formutils.js';

const journeyName = 'CORPORATE_CREDIT_CARD';
const currentFormContext = {
  journeyID: createJourneyId('a', 'b', 'c'),
  journeyName,
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
  };
  currentFormContext.isCustomerIdentified = res?.customerIdentificationResponse?.CustomerIdentificationResponse?.errorCode === '0' ? 'Y' : 'N';
  const welcomeTxt = formUtil(globals, pannel.welcome);
  const otpPanel = formUtil(globals, pannel.otp);
  const otpBtn = formUtil(globals, pannel.otpButton);
  const loginPanel = formUtil(globals, pannel.login);
  const regMobNo = pannel.login.registeredMobileNumber.$value;

  welcomeTxt.visible(false);
  otpBtn.visible(false);
  loginPanel.visible(false);
  otpPanel.visible(true);

  // otHelpText-appending the masked registerMobileNumber -
  const otpHelpText = document.getElementsByClassName('form-otphelptext')[0];
  const pElement = otpHelpText.querySelector('p');
  pElement.classList.add('otp-message');
  pElement.textContent = `${pElement.textContent}${maskNumber(regMobNo, 6)}`;
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
  const regMobNo = pannel.login.registeredMobileNumber.$value;
  const failurePanel = formUtil(globals, pannel.resultPanel);

  welcomeTxt.visible(false);
  otpPanel.visible(false);
  loginPanel.visible(false);
  otpBtn.visible(false);
  failurePanel.visible(true);

  // otHelpText-appending the masked registerMobileNumber -
  const otpHelpText = document.getElementsByClassName('form-otphelptext')[0];
  const pElement = otpHelpText.querySelector('p');
  pElement.classList.add('otp-message');
  pElement.textContent = `${pElement.textContent}${maskNumber(regMobNo, 6)}`;
};

const OTPGEN = {
  getPayload(globals) {
    const mobileNo = globals.form.loginPanel.registeredMobileNumber.$value;
    const panNo = globals.form.loginPanel.pan.$value;
    const dob = clearString(globals.form.loginPanel.dateOfBirth.$value); // no special characters
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
    console.log(`I am in errorCallback ${globals}`);
  },
  path: urlPath('/content/hdfc_ccforms/api/customeridentificationV4.json'),
  loadingText: 'Please wait while we are authenticating you',
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
  const ccWizardPannel = formUtil(globals, pannel.ccWizardView);
  // const resultPanel = formUtil(globals, pannel.resultPanel);

  welcomeTxt.visible(false);
  otpBtn.visible(false);
  loginPanel.visible(false);
  otpPanel.visible(false);
  ccWizardPannel.visible(true);
  (async () => {
    const myImportedModule = await import('./cc.js');
    myImportedModule.onWizardInit();
  })();
  // resultPanel.visible(true);
};

const OTPVAL = {
  getPayload(globals) {
    const mobileNo = globals.form.loginPanel.registeredMobileNumber.$value;
    const panNo = globals.form.loginPanel.pan.$value;
    const passwordValue = globals.form.otpPanel.otpNumber.$value;
    const dob = clearString(globals.form.loginPanel.dateOfBirth.$value); // no special characters
    const jsonObj = {};
    jsonObj.requestString = {};
    jsonObj.requestString.mobileNumber = String(mobileNo) ?? '';
    jsonObj.requestString.panNumber = String(panNo) ?? '';
    jsonObj.requestString.dateOfBirth = String(dob) ?? '';
    jsonObj.requestString.channelSource = '';
    jsonObj.requestString.dedupeFlag = 'N';
    jsonObj.requestString.passwordValue = passwordValue ?? '';
    jsonObj.requestString.referenceNumber = `AD${getTimeStamp(new Date())}` ?? '';
    jsonObj.requestString.journeyID = currentFormContext.journeyID;
    jsonObj.requestString.journeyName = currentFormContext.journeyName;
    jsonObj.requestString.userAgent = window.navigator.userAgent;
    jsonObj.requestString.existingCustomer = currentFormContext.isCustomerIdentified ?? '';
    return jsonObj;
  },
  successCallback(res, globals) {
    return (res?.otpGenResponse?.status?.errorCode === '0') ? otpValSuccess(res, globals) : otpValFailure(res, globals);
  },
  errorCallback(err, globals) {
    console.log(`I am in errorCallback_OtpFailure ${globals}`);
  },
  path: urlPath('/content/hdfc_cc_unified/api/otpValFetchAssetDemog.json'),
  loadingText: 'Please wait while we are authenticating you',
};

/**
 * Moves the corporate card wizard view from your detail step to confirm card step
 */
const moveCCWizardView = () => {
  const navigateFrom = document.getElementsByName('corporateCardWizardView')[0];
  const current = navigateFrom.querySelector('.current-wizard-step');
  const navigateTo = document.getElementsByName('confirmCardPanel')[0];
  current.classList.remove('current-wizard-step');
  navigateTo.classList.add('current-wizard-step');
  const event = new CustomEvent('wizard:navigate', {
    detail: {
      prevStep: { id: current.id, index: +current.dataset.index },
      currStep: { id: navigateTo.id, index: +navigateTo.dataset.index },
    },
    bubbles: false,
  });
  navigateFrom.dispatchEvent(event);
};

/**
 * Handles the success scenario on check offer.
 * @param {any} res - The response object containing the check offer success response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const checkOfferSuccess = (res, globals) => moveCCWizardView();

/**
 * Handles the failure scenario on check offer.
 * @param {any} err - The response object containing the check offer failure response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const checkOfferFailure = (err, globals) => moveCCWizardView();

const CHECKOFFER = {
  getPayload(globals) {
    const mobileNo = globals.form.loginPanel.registeredMobileNumber.$value;
    const jsonObj = {};
    jsonObj.requestString = {};
    jsonObj.requestString.mobileNumber = String(mobileNo) ?? '';
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
export { OTPGEN, OTPVAL, CHECKOFFER };
