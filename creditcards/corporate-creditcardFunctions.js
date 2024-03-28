/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/* eslint no-unused-vars: ["error", { "args": "none" }] */
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
  * Decorates the password input to hide the text and display only bullets
  * @name decoratePasswordField Runs after user clicks on Get OTP
  */
function decoratePwdField() {
  const pwdInput = document.querySelector('main .form .field-otppanel .field-otpnumber input');
  pwdInput.type = 'password';
}

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
  decoratePwdField();
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
 * Add a class to the label associated with the specified input elements.
 * @param {string} selector - The CSS selector for the input elements.
 * @param {string} className - The class name to add to the labels.
 */
const addClassToFieldLabel = (selector, className) => {
  /**
   * Retrieve the labels associated with the specified input elements and add the class to them.
   * @param {Element} input - The input element.
   */
  const addClassToLabel = (input) => {
    const inputId = input.id;
    const label = document.querySelector(`label[for="${inputId}"]`);
    if (label) {
      label.classList.add(className);
    }
  };

  // Select all input elements using the provided selector
  const elements = document.querySelectorAll(selector);

  // Iterate over each input element and add the class to its associated label
  elements.forEach(addClassToLabel);
};
/* Automatically fills form fields based on response data.
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
  addClassToFieldLabel('.form input[disabled], .form select[disabled]', 'label-disabled');
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
    incorrectOtpText: globals.form.incorrectOTPText,
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
  /* startCode- switchCase otp-error-scenarios- */
  switch (res?.otpValidationResponse?.errorCode) {
    case '02': {
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
    // case '04': {
    //   debugger;
    //   errorPannel.setValue('You have entered invalid OTP for 3 consecutive attempts. Please try again later');
    //   break;
    // }
    // case '08': {
    //   // "errorMessage": "No password in system",
    //   //   "errorCode": "08"
    //   break;
    // You have entered invalid OTP for 3 consecutive attempts. Please try again later
    // }
    default: {
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

export {
  OTPGEN, OTPVAL, CHECKOFFER, RESENDOTP, getThisCard,
};
