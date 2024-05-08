/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/* eslint no-unused-vars: ["error", { "args": "none" }] */
import { createJourneyId, currentFormContext } from '../common/journey-utils.js';
import PANValidationAndNameMatchService from '../common/panvalidation.js';
import executeCheck from '../common/panutils.js';
import { customerValidationHandler, executeInterfaceApiFinal } from '../common/executeinterfaceutils.js';
import {
  formUtil,
  maskNumber,
  urlPath,
  clearString,
  getTimeStamp,
  convertDateToMmmDdYyyy,
  setDataAttributeOnClosestAncestor,
  convertDateToDdMmYyyy,
  setSelectOptions,
  composeNameOption,
  moveWizardView,
  parseCustomerAddress,
  removeSpecialCharacters,
  makeFieldInvalid,
} from '../common/formutils.js';
import { getJsonResponse } from '../common/makeRestAPI.js';

const journeyName = 'CORPORATE_CARD_JOURNEY';
currentFormContext.journeyID = createJourneyId('a', 'b', 'c');
currentFormContext.journeyName = journeyName;
currentFormContext.journeyType = 'NTB';
let PAN_VALIDATION_STATUS = false;
let PAN_RETRY_COUNTER = 1;
let resendOtpCount = 3;
let IS_ETB_USER = false;
const CUSTOMER_INPUT = { mobileNumber: '', pan: '', dob: '' };
const CUSTOMER_DEMOG_DATA = {};
let BRE_DEMOG_RESPONSE = {};
const ALLOWED_CHARACTERS = '/ -,';
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
  removeBanner();
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

/**
 * Handles toggling of the current address based on certain conditions.
 *
 * @param {Object} globals - Global object containing form and context information.
 * @returns {void}
 */
const currentAddressToggleHandler = (globals) => {
  if (currentFormContext.journeyType === 'ETB' && globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressETB.currentAddressToggle.$value === 'on') {
    const { newCurentAddressPanel } = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressETB;

    const newCurentAddressLine1 = formUtil(globals, newCurentAddressPanel.newCurentAddressLine1);
    const newCurentAddressLine2 = formUtil(globals, newCurentAddressPanel.newCurentAddressLine2);
    const newCurentAddressLine3 = formUtil(globals, newCurentAddressPanel.newCurentAddressLine3);
    const newCurentAddressCity = formUtil(globals, newCurentAddressPanel.newCurentAddressCity);
    const newCurentAddressPin = formUtil(globals, newCurentAddressPanel.newCurentAddressPin);
    const newCurentAddressState = formUtil(globals, newCurentAddressPanel.newCurentAddressState);

    /**
     * Sets the address fields with the parsed customer address data.
     * If the customer address is not available, it parses and sets it from BRE_DEMOG_RESPONSE.
     */
    const setAddress = () => {
      newCurentAddressLine1.setValue(currentFormContext.customerParsedAddress[0], { attrChange: true, value: false });
      newCurentAddressLine2.setValue(currentFormContext.customerParsedAddress[1], { attrChange: true, value: false });
      newCurentAddressLine3.setValue(currentFormContext.customerParsedAddress[2], { attrChange: true, value: false });
    };

    // Check if BRE_DEMOG_RESPONSE exists and if the BREFILLER2 is 'D106'
    if (BRE_DEMOG_RESPONSE?.BREFILLER2.toUpperCase() === 'D106') {
      // Check if customerParsedAddress has data, if not, parse from BRE_DEMOG_RESPONSE
      if (currentFormContext?.customerParsedAddress.length > 0) {
        setAddress();
      } else {
        const fullAddress = [
          removeSpecialCharacters(BRE_DEMOG_RESPONSE?.VDCUSTADD1, ALLOWED_CHARACTERS),
          removeSpecialCharacters(BRE_DEMOG_RESPONSE?.VDCUSTADD2, ALLOWED_CHARACTERS),
          removeSpecialCharacters(BRE_DEMOG_RESPONSE?.VDCUSTADD3, ALLOWED_CHARACTERS),
        ].filter(Boolean).join('');
        currentFormContext.customerParsedAddress = parseCustomerAddress(fullAddress);
        setAddress();
      }
    } else {
      // Set address fields from BRE_DEMOG_RESPONSE if BREFILLER2 is not 'D106'
      newCurentAddressLine1.setValue(removeSpecialCharacters(BRE_DEMOG_RESPONSE?.VDCUSTADD1, ALLOWED_CHARACTERS), { attrChange: true, value: false });
      newCurentAddressLine2.setValue(removeSpecialCharacters(BRE_DEMOG_RESPONSE?.VDCUSTADD2, ALLOWED_CHARACTERS), { attrChange: true, value: false });
      newCurentAddressLine3.setValue(removeSpecialCharacters(BRE_DEMOG_RESPONSE?.VDCUSTADD3, ALLOWED_CHARACTERS), { attrChange: true, value: false });
    }

    newCurentAddressCity.setValue(BRE_DEMOG_RESPONSE?.VDCUSTCITY, { attrChange: true, value: false });
    newCurentAddressPin.setValue(BRE_DEMOG_RESPONSE?.VDCUSTZIPCODE, { attrChange: true, value: false });
    newCurentAddressState.setValue(BRE_DEMOG_RESPONSE?.VDCUSTSTATE, { attrChange: true, value: false });
  }
};

/* Automatically fills form fields based on response data.
 * @param {object} res - The response data object.
 * @param {object} globals - Global variables object.
 * @param {object} panel - Panel object.
 */
const personalDetailsPreFillFromBRE = (res, globals) => {
  const changeDataAttrObj = { attrChange: true, value: false, disable: true };
  const genderMap = { M: '1', F: '2', O: 'T' };
  // Extract personal details from globals
  const personalDetails = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails;
  const currentAddressNTB = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressNTB;
  const currentAddressETB = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressETB;
  const currentAddressNTBUtil = formUtil(globals, currentAddressNTB);
  currentAddressNTBUtil.visible(false);
  // Extract breCheckAndFetchDemogResponse from res
  const breCheckAndFetchDemogResponse = res?.demogResponse?.BRECheckAndFetchDemogResponse;

  if (!breCheckAndFetchDemogResponse) return;
  BRE_DEMOG_RESPONSE = breCheckAndFetchDemogResponse;
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
      if (field === 'gender') {
        formField.setValue(genderMap[value], changeDataAttrObj);
      } else {
        formField.setValue(value, changeDataAttrObj);
      }
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
    dobPersonalDetails.setValue(convertDateToMmmDdYyyy(custDate.toString()), changeDataAttrObj);
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
  const fullAddress = [
    removeSpecialCharacters(breCheckAndFetchDemogResponse?.VDCUSTADD1, ALLOWED_CHARACTERS),
    removeSpecialCharacters(breCheckAndFetchDemogResponse?.VDCUSTADD2, ALLOWED_CHARACTERS),
    removeSpecialCharacters(breCheckAndFetchDemogResponse?.VDCUSTADD3, ALLOWED_CHARACTERS),
  ].filter(Boolean).join('');
  if (fullAddress.length < 30) {
    const currentAddressETBToggle = formUtil(globals, currentAddressETB.currentAddressToggle);
    currentAddressETBToggle.setValue('on');
    currentAddressETBToggle.enabled(false);
    currentAddressToggleHandler(globals);
  }
  const personaldetails = document.querySelector('.field-personaldetails');
  personaldetails.classList.add('personaldetails-disabled');
  addDisableClass(personaldetails);
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

const showErrorPanel = (panels, errorText) => {
  const errorTextPannelName = 'errorResultPanel';
  changeTextContent(errorTextPannelName, errorText);
  const { hidePanels, showPanels } = panels;
  hidePanels.forEach((panel) => {
    panel.visible(false);
  });
  showPanels.forEach((panel) => {
    panel.visible(true);
  });
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
  currentFormContext.productCode = globals.functions.exportData().data.CorporateCreditCard.productCode;
  currentFormContext.promoCode = globals.functions.exportData().data.CorporateCreditCard.promoCode;
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
  currentFormContext.jwtToken = res?.demogResponse?.Id_token_jwt;
  const existingCustomer = existingCustomerCheck(res);
  if (existingCustomer) {
    IS_ETB_USER = true;
    currentFormContext.journeyType = 'ETB';
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
      const panels = {
        hidePanels: [incorectOtp, welcomeTxt, otpBtn, loginPanel, otpPanel, resultSetErrorText1, resultSetErrorText2],
        showPanels: [resultPanel, tryAgainButtonErrorPanel],
      };
      const errorText = 'You have entered invalid OTP for 3 consecutive attempts. Please try again later';
      showErrorPanel(panels, errorText);
      const reloadBtn = document.getElementsByName('tryAgainButtonErrorPanel')?.[0];
      reloadBtn.addEventListener('click', () => window.location.reload());
      break;
    }
    case 'CZ_HTTP_0003': {
      const panels = {
        hidePanels: [incorectOtp, welcomeTxt, otpBtn, loginPanel, otpPanel, resultSetErrorText1, resultSetErrorText2],
        showPanels: [resultPanel],
      };
      const errorText = 'Unfortunately, we were unable to process your request';
      changeTextContent(panels, errorText);
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
 * Populate and set the users current and office address fields in confirm and submit screen.
 * @param {Object} globals - The global object containing form and other data.
 */
const setConfirmScrAddressFields = (globalObj) => {
  /**
   * Concatenates the values of an object into a single string separated by commas.
   * @param {Object} obj - The object whose values are to be concatenated.
   * @returns {string} A string containing the concatenated values separated by commas.
   */
  const concatObjVals = (obj) => Object.values(obj)?.join(', ');
  const ccWizard = globalObj.form.corporateCardWizardView;
  const yourDetails = ccWizard.yourDetailsPanel.yourDetailsPage;
  const currentDetails = yourDetails.currentDetails;
  const etb = currentDetails.currentAddressETB;
  const ntb = currentDetails.currentAddressNTB;
  const employeeDetails = yourDetails.employmentDetails;
  const confirmAddress = ccWizard.confirmAndSubmitPanel.AddressDeclarationPanel;
  const ovdNtb = confirmAddress.addressDeclarationOVD.cardDeliveryNTBFlow;
  const etbPrefilledAddress = etb.prefilledCurrentAdddress.$value;
  const etbNewCurentAddress = concatObjVals({
    addressLine1: etb.newCurentAddressPanel.newCurentAddressLine1.$value,
    addressLine2: etb.newCurentAddressPanel.newCurentAddressLine2.$value,
    addressLine3: etb.newCurentAddressPanel.newCurentAddressLine3.$value,
    city: etb.newCurentAddressPanel.newCurentAddressCity.$value,
    state: etb.newCurentAddressPanel.newCurentAddressState.$value,
    pincode: etb.newCurentAddressPanel.newCurentAddressState.$value,
  });
  const etbCurentAddress = (currentFormContext.journeyType === 'ETB' && etb.currentAddressToggle.$value === 'off') ? etbPrefilledAddress : etbNewCurentAddress;
  const ntbCurrentAddress = concatObjVals({
    addressLine1: ntb.addressLine1.$value,
    addressLine2: ntb.addressLine2.$value,
    addressLine3: ntb.addressLine3.$value,
    city: ntb.city.$value,
    state: ntb.state.$value,
    pincode: ntb.currentAddresPincodeNTB.$value,
  });
  const officeAddress = concatObjVals({
    addressLine1: employeeDetails.officeAddressLine1.$value,
    addressLine2: employeeDetails.officeAddressLine2.$value,
    addressLine3: employeeDetails.officeAddressLine3.$value,
    city: employeeDetails.officeAddressCity.$value,
    state: employeeDetails.officeAddressState.$value,
    pincode: employeeDetails.officeAddressPincode.$value,
  });
  const userCurrentAddress = (currentFormContext.journeyType === 'ETB') ? etbCurentAddress : ntbCurrentAddress;

  const officeAddressFieldOVD = formUtil(globalObj, ovdNtb.officeAddressOVD.officeAddressOVDAddress);
  const kycOfficeAddressField = formUtil(globalObj, confirmAddress.addressDeclarationOffice.officeAddressSelectKYC);
  const currentAddressFieldOVD = formUtil(globalObj, ovdNtb.currentAddressOVD.currentAddressOVDAddress);
  const residenceAddressField = formUtil(globalObj, confirmAddress.CurrentAddressDeclaration.currentResidenceAddress);
  const biometricAddressField = formUtil(globalObj, confirmAddress.currentAddressBiometric.currentResidenceAddressBiometricText);

  const fieldFill = {
    officeAddress: [officeAddressFieldOVD, kycOfficeAddressField],
    userCurrentAddress: [currentAddressFieldOVD, residenceAddressField, biometricAddressField],
  };
  Object.entries(fieldFill).forEach(([addressType, valueField]) => {
    valueField?.forEach((field) => {
      field?.setValue(addressType === 'officeAddress' ? officeAddress : userCurrentAddress);
    });
  });
};

/**
 * Moves the wizard view to the "selectKycPaymentPanel" step.
 */
const getThisCard = (globals) => {
  const nameOnCardDropdown = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.CorporatetImageAndNamePanel.nameOnCardDropdown.$value;
  executeInterfaceApiFinal(globals);
  setConfirmScrAddressFields(globals);
  moveWizardView('corporateCardWizardView', 'selectKycPaymentPanel');
};

/**
 * Moves the wizard view to the "confirmAndSubmitPanel" step.
 */
const getAddressDetails = () => moveWizardView('corporateCardWizardView', 'confirmAndSubmitPanel');

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

  const terminationCheck = false;
  switch (IS_ETB_USER) {
    case true:
      if (CUSTOMER_INPUT.pan) {
        executeCheck(panStatus, terminationCheck, customerValidationHandler, globals, BRE_DEMOG_RESPONSE);
      } else if (CUSTOMER_INPUT.dob) {
        if (!CUSTOMER_DEMOG_DATA.panNumberPersonalDetails || !CUSTOMER_DEMOG_DATA.lastName) {
          const result = demogDataCheck(panStatus);
          if (result.proceed) {
            executeCheck(panStatus, result.terminationCheck, customerValidationHandler, globals, BRE_DEMOG_RESPONSE);
          }
        } else {
          executeCheck(panStatus, terminationCheck, customerValidationHandler, globals, BRE_DEMOG_RESPONSE);
        }
      }
      break;
    case false:
      executeCheck(panStatus, terminationCheck, customerValidationHandler, globals, BRE_DEMOG_RESPONSE);
      break;
    default:
      break;
  }
};

/**
 * Creates a PAN validation request object and handles success and failure callbacks.
 * @param {string} firstName - The first name of the cardholder.
 * @param {string} middleName - The last name of the cardholder.
 * @param {string} lastName - The last name of the cardholder.
 * @param {Object} globals - The global object containing necessary data for PAN validation.
 * @returns {Object} - The PAN validation request object.
 */
const createPanValidationRequest = (firstName, middleName, lastName, globals) => {
  currentFormContext.customerName = { firstName, middleName, lastName }; // required for listNameOnCard function.
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
          const ccWizardView = globals.form.corporateCardWizardView;
          const resultPanel = globals.form.resultPanel;
          const tryAgainButtonErrorPanel = globals.form.resultPanel.errorResultPanel.tryAgainButtonErrorPanel;
          const ccWizardViewBlock = formUtil(globals, ccWizardView);
          const resultPanelBlock = formUtil(globals, resultPanel);
          const tryAgainButtonErrorPanelBlock = formUtil(globals, tryAgainButtonErrorPanel);
          if (responseObj?.statusCode === 'FC00') {
            PAN_VALIDATION_STATUS = responseObj.panValidation.status.errorCode === '1';
            if (PAN_VALIDATION_STATUS) {
              const panStatus = responseObj.panValidation.panStatus;
              checkUserProceedStatus(panStatus, globals);
            } else {
              const panels = {
                hidePanels: [ccWizardViewBlock],
                showPanels: [resultPanelBlock, tryAgainButtonErrorPanelBlock],
              };
              const errorText = 'PAN validation unsuccessful.';
              showErrorPanel(panels, errorText);
              const reloadBtn = document.getElementsByName('tryAgainButtonErrorPanel')?.[0];
              reloadBtn.addEventListener('click', () => window.location.reload());
            }
          } else {
            const panels = {
              hidePanels: [ccWizardViewBlock],
              showPanels: [resultPanelBlock, tryAgainButtonErrorPanelBlock],
            };
            const errorText = 'PAN validation API error.';
            showErrorPanel(panels, errorText);
            const reloadBtn = document.getElementsByName('tryAgainButtonErrorPanel')?.[0];
            reloadBtn.addEventListener('click', () => window.location.reload());
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

/**
 * logic hanlding during prefill of form.
 * @param {object} globals - The global object containing necessary globals form data.
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

/**
 * Handles API call for validating pinCode using the pinCodeMaster function.
 * @param {object} globalObj - The global object containing necessary globals form data.
 * @param {object} cityField - The City field object from the global object.
 * @param {object} stateField - The State field object from the global object.
 * @param {object} pincodeField - The PinCode field object from the global object.
 */
const pinmasterApi = async (globalObj, cityField, stateField, pincodeField) => {
  const PIN_CODE_LENGTH = 6;
  if (pincodeField?.$value?.length < PIN_CODE_LENGTH) return;
  const url = urlPath(`/content/hdfc_commonforms/api/mdm.CREDIT.SIX_DIGIT_PINCODE.PINCODE-${pincodeField?.$value}.json`);
  const method = 'GET';
  const setCityField = formUtil(globalObj, cityField);
  const setStateField = formUtil(globalObj, stateField);
  const setPincodeField = formUtil(globalObj, pincodeField);
  const resetStateCityFields = () => {
    setCityField.resetField();
    setStateField.resetField();
    setCityField.enabled(false);
    setStateField.enabled(false);
  };
  const errorMethod = (errStack) => {
    const { errorCode, errorMessage } = errStack;
    const defErrMessage = 'Please enter a valid pincode';
    if (errorCode === '500') {
      setPincodeField.markInvalid(false, defErrMessage);
      resetStateCityFields();
    }
  };
  const successMethod = (value) => {
    const changeDataAttrObj = { attrChange: true, value: false };
    setCityField.setValue(value?.CITY, changeDataAttrObj);
    setCityField.enabled(false);
    setStateField.setValue(value?.STATE, changeDataAttrObj);
    setStateField.enabled(false);
  };
  try {
    const response = await getJsonResponse(url, null, method);
    const [{ CITY, STATE }] = response;
    const [{ errorCode, errorMessage }] = response;
    if (CITY && STATE) {
      successMethod({ CITY, STATE });
    } else if (errorCode) {
      const errStack = { errorCode, errorMessage };
      throw errStack;
    }
  } catch (error) {
    errorMethod(error);
  }
};

/**
 * pincode validation in your details for NTB and ETB
 * @param {object} globals - The global object containing necessary globals form data.
 */
const pinCodeMaster = async (globals) => {
  const yourDetails = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage;
  const currentDetails = yourDetails.currentDetails;
  const employeeDetails = yourDetails.employmentDetails;
  const addressCurentNtb = currentDetails.currentAddressNTB;
  const permanentAddressNtb = addressCurentNtb.permanentAddress.permanentAddressPanel;
  const newAddressEtb = currentDetails.currentAddressETB.newCurentAddressPanel;
  const pinMasterConstants = [
    {
      keyFlow: 'NTB_CURRENT_ADDRESS_FIELD',
      pincodeField: addressCurentNtb.currentAddresPincodeNTB,
      cityField: addressCurentNtb.city,
      stateField: addressCurentNtb.state,
    },
    {
      keyFlow: 'NTB_PERMANENT_ADDRESS_FIELD',
      pincodeField: permanentAddressNtb.permanentAddressPincode,
      cityField: permanentAddressNtb.permanentAddressCity,
      stateField: permanentAddressNtb.permanentAddressState,
    },
    {
      keyFlow: 'ETB_NEW_ADDRESS_FIELD',
      pincodeField: newAddressEtb.newCurentAddressPin,
      cityField: newAddressEtb.newCurentAddressCity,
      stateField: newAddressEtb.newCurentAddressState,
    },
    {
      keyFlow: 'OFFICE_ADDRESS_FIELD',
      pincodeField: employeeDetails.officeAddressPincode,
      cityField: employeeDetails.officeAddressCity,
      stateField: employeeDetails.officeAddressState,
    },
  ];
  pinMasterConstants?.forEach((field) => (field.pincodeField.$value && pinmasterApi(globals, field.cityField, field.stateField, field.pincodeField)));
};

/**
 * validate email id in personal details screen for the NTB
 * @param {object} globals - The global object containing necessary globals form data.
 */
const validateEmailID = async (globals) => {
  const emailField = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.personalEmailAddress;
  if (!emailField.$valid) return;
  const url = urlPath('/content/hdfc_commonforms/api/emailid.json');
  const setEmailField = formUtil(globals, emailField);
  const invalidMsg = 'Please enter email id.';
  const payload = {
    email: emailField.$value,
  };
  const method = 'POST';
  try {
    const emailValid = await getJsonResponse(url, payload, method);
    if (!emailValid) {
      setEmailField.markInvalid(emailValid, invalidMsg);
    }
  } catch (error) {
    console.error(error, 'NTB_email_error');
  }
};
export {
  OTPGEN,
  OTPVAL,
  RESENDOTP,
  getThisCard,
  prefillForm,
  currentFormContext,
  createPanValidationRequest,
  getAddressDetails,
  pinCodeMaster,
  validateEmailID,
  currentAddressToggleHandler,
};
