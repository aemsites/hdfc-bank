/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import createJourneyId from '../common/journey-utils.js';
import {
  formUtil, maskNumber, urlPath, clearString,
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
  const regMobNo = pannel.login.registeredMobileNumber.$value;

  const panWizardField = formUtil(globals, pannel.panWizardField);
  const dobWizardField = formUtil(globals, pannel.dobWizardField);
  const currentAddressNTB = formUtil(globals, pannel.currentAddressNTB);
  const currentAddressETB = formUtil(globals, pannel.currentAddressETB);

  welcomeTxt.visible(false);
  otpBtn.visible(false);
  loginPanel.visible(false);
  otpPanel.visible(true);

  if (pannel.login.pan.$value) {
    panWizardField.visible(true);
    dobWizardField.visible(false);
  } else {
    panWizardField.visible(false);
    dobWizardField.visible(true);
  }
  if (currentFormContext.existingCustomer === 'Y') {
    currentAddressETB.visible(true);
    currentAddressNTB.visible(false);
  } else {
    currentAddressETB.visible(false);
    currentAddressNTB.visible(true);
  }

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
    otpGenFailure(err, globals);
    console.log(`I am in errorCallback OTP GEN ${globals}`);
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
  if (currentFormContext.existingCustomer === 'Y') {
    // prefilling logic to start
    // Gender prefill
    const custGender = res.otpValidationResponse.demogResponse.BRECheckAndFetchDemogResponse.VDCUSTGENDER;
    // eslint-disable-next-line no-nested-ternary
    const Gender = (custGender === 'M') ? 'Male' : (custGender === 'F') ? 'Female' : 'Others';
    globals.functions.setProperty(globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.gender, { value: Gender });

    // First name ,last name,Middle name prefilling
    const FullName = res.otpValidationResponse.demogResponse.BRECheckAndFetchDemogResponse.VDCUSTFULLNAME;
    const firstName = FullName.split(' ')[0];
    let middleName; let lastName;
    if (FullName.split(' ').length - 1 >= 2) {
      middleName = FullName.split(' ')[1];
      lastName = FullName.value.split(' ')[FullName.split(' ').length - 1];
    } else {
      lastName = FullName.split(' ')[1];
      middleName = '';
    }

    globals.functions.setProperty(globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.firstName, { value: firstName });
    globals.functions.setProperty(globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.lastName, { value: lastName });
    globals.functions.setProperty(globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.middleName, { value: middleName });

    // Date/Pan prefilling
    const convertDateFormat = (date) => {
      const year = date.slice(0, 4);
      const month = date.slice(4, 6).padStart(2, '0');
      const day = date.slice(6, 8).padStart(2, '0');
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return new Date(year, month - 1, day).toLocaleDateString('en-US', options);
    };
    if (pannel.login.pan.$value) {
      const custDate = res.otpValidationResponse.demogResponse.BRECheckAndFetchDemogResponse.DDCUSTDATEOFBIRTH;
      globals.functions.setProperty(globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.dobPersonalDetails, { value: convertDateFormat(custDate.toString()) });
    } else {
      // pan prefilling
      const panValue = res.otpValidationResponse.demogResponse.BRECheckAndFetchDemogResponse.VDCUSTITNBR;
      globals.functions.setProperty(globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.dobPersonalDetails, { value: panValue });
    }

    // Address line prefilling
    const AddressPrefill = `${res.otpValidationResponse.demogResponse.BRECheckAndFetchDemogResponse.VDCUSTADD1},${res.otpValidationResponse.demogResponse.BRECheckAndFetchDemogResponse.VDCUSTADD2},${res.otpValidationResponse.demogResponse.BRECheckAndFetchDemogResponse.VDCUSTADD3},${res.otpValidationResponse.demogResponse.BRECheckAndFetchDemogResponse.VDCUSTCITY},${
      res.otpValidationResponse.demogResponse.BRECheckAndFetchDemogResponse.VDCUSTSTATE},${
      res.otpValidationResponse.demogResponse.BRECheckAndFetchDemogResponse.VDCUSTZIPCODE}`;
    globals.functions.setProperty(globals.form.corporateCardWizardView.yourDetailsPanel.currentDetails.currentAddressETB.prefilledCurrentAdddress, { value: AddressPrefill });
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
    jsonObj.requestString.identifierValue = panNo || dob;
    jsonObj.requestString.identifierName = panNo ? 'PAN' : 'DOB';
    jsonObj.requestString.passwordValue = passwordValue ?? '';
    jsonObj.requestString.journeyID = currentFormContext.journeyID;
    jsonObj.requestString.journeyName = currentFormContext.journeyName;
    jsonObj.requestString.userAgent = window.navigator.userAgent;
    return jsonObj;
  },
  successCallback(res, globals) {
    return (res?.otpGenResponse?.status?.errorCode === '0') ? otpValSuccess(res, globals) : otpValFailure(res, globals);
  },
  errorCallback(err, globals) {
    otpValFailure(err, globals);
    console.log(`I am in errorCallback_OtpFailure ${globals}`);
  },
  path: urlPath('/content/hdfc_cc_unified/api/otpValFetchAssetDemog.json'),
  loadingText: 'Please wait while we are authenticating you',
};
export { OTPGEN, OTPVAL };
