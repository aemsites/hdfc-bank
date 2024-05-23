/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-tabs */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/* eslint no-unused-vars: ["error", { "args": "none" }] */
import {
  invokeJourneyDropOff, invokeJourneyDropOffUpdate, journeyResponseHandlerUtil, invokeJourneyDropOffB, currentFormContext, createJourneyId,
} from '../common/journey-utils.js';
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
  santizedFormData,
  makeFieldInvalid,
  dateFormat,
} from '../common/formutils.js';
import {
  getJsonResponse,
  restAPICall,
  displayLoader, hideLoaderGif,
} from '../common/makeRestAPI.js';

// Initialize all Corporate Card Journey Context Variables.
const journeyName = 'CORPORATE_CARD_JOURNEY';
currentFormContext.journeyName = journeyName;
currentFormContext.journeyType = 'NTB';
currentFormContext.formName = 'CorporateCreditCard';
currentFormContext.errorCode = '';
currentFormContext.errorMessage = '';
currentFormContext.eligibleOffers = '';
currentFormContext.getOtpLoader = currentFormContext.getOtpLoader || (typeof window !== 'undefined') ? displayLoader : false;
currentFormContext.otpValLoader = currentFormContext.otpValLoader || (typeof window !== 'undefined') ? displayLoader : false;
currentFormContext.validatePanLoader = (typeof window !== 'undefined') ? displayLoader : false;
currentFormContext.executeInterface = (typeof window !== 'undefined') ? displayLoader : false;
currentFormContext.ipa = (typeof window !== 'undefined') ? displayLoader : false;
currentFormContext.aadharInit = (typeof window !== 'undefined') ? displayLoader : false;
currentFormContext.hideLoader = (typeof window !== 'undefined') ? hideLoaderGif : false;

let PAN_VALIDATION_STATUS = false;
let PAN_RETRY_COUNTER = 1;
const resendOtpCount = 3;
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
  if (
    currentFormContext.journeyType === 'ETB'
    && globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressETB.currentAddressToggle.$value
    === 'on'
  ) {
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
  // eslint-disable-next-line no-tabs
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
        ]
          .filter(Boolean)
          .join('');
        currentFormContext.customerParsedAddress = parseCustomerAddress(fullAddress);
        setAddress();
      }
    } else {
      // Set address fields from BRE_DEMOG_RESPONSE if BREFILLER2 is not 'D106'
      newCurentAddressLine1.setValue(removeSpecialCharacters(BRE_DEMOG_RESPONSE?.VDCUSTADD1, ALLOWED_CHARACTERS), {
        attrChange: true,
        value: false,
      });
      newCurentAddressLine2.setValue(removeSpecialCharacters(BRE_DEMOG_RESPONSE?.VDCUSTADD2, ALLOWED_CHARACTERS), {
        attrChange: true,
        value: false,
      });
      newCurentAddressLine3.setValue(removeSpecialCharacters(BRE_DEMOG_RESPONSE?.VDCUSTADD3, ALLOWED_CHARACTERS), {
        attrChange: true,
        value: false,
      });
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
  currentFormContext.breDemogResponse = breCheckAndFetchDemogResponse;
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
  ]
    .filter(Boolean)
    .join(', ');
  const prefilledCurrentAdddress = formUtil(globals, currentAddressETB.prefilledCurrentAdddress);
  prefilledCurrentAdddress.setValue(completeAddress);
  const currentAddressETBUtil = formUtil(globals, currentAddressETB);
  currentAddressETBUtil.visible(true);
  const fullAddress = [
    removeSpecialCharacters(breCheckAndFetchDemogResponse?.VDCUSTADD1, ALLOWED_CHARACTERS),
    removeSpecialCharacters(breCheckAndFetchDemogResponse?.VDCUSTADD2, ALLOWED_CHARACTERS),
    removeSpecialCharacters(breCheckAndFetchDemogResponse?.VDCUSTADD3, ALLOWED_CHARACTERS),
  ]
    .filter(Boolean)
    .join('');
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
const otpValHandler = (response, globals) => {
  const res = {};
  res.demogResponse = response;
  currentFormContext.isCustomerIdentified = res?.demogResponse?.errorCode === '0' ? 'Y' : 'N';
  currentFormContext.productCode = globals.functions.exportData().form.productCode;
  currentFormContext.promoCode = globals.functions.exportData().form.promoCode;
  currentFormContext.jwtToken = res?.demogResponse?.Id_token_jwt;
  currentFormContext.panFromDemog = res?.demogResponse?.BRECheckAndFetchDemogResponse?.VDCUSTITNBR;
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
  const etbCurentAddress = currentFormContext.journeyType === 'ETB' && etb.currentAddressToggle.$value === 'off' ? etbPrefilledAddress : etbNewCurentAddress;
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
  const userCurrentAddress = currentFormContext.journeyType === 'ETB' ? etbCurentAddress : ntbCurrentAddress;

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
        executeCheck(panStatus, terminationCheck, customerValidationHandler, globals);
      } else if (CUSTOMER_INPUT.dob) {
        if (!CUSTOMER_DEMOG_DATA.panNumberPersonalDetails || !CUSTOMER_DEMOG_DATA.lastName) {
          const result = demogDataCheck(panStatus);
          if (result.proceed) {
            executeCheck(panStatus, result.terminationCheck, customerValidationHandler, globals);
          }
        } else {
          executeCheck(panStatus, terminationCheck, customerValidationHandler, globals);
        }
      }
      break;
    case false:
      executeCheck(panStatus, terminationCheck, customerValidationHandler, globals);
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
            panNumber:
              personalDetails.panNumberPersonalDetails.$value !== null
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
        const errStack = {};
        if (responseObj?.statusCode === 'FC00') {
          PAN_VALIDATION_STATUS = responseObj.panValidation.status.errorCode === '1';
          if (PAN_VALIDATION_STATUS) {
            const panStatus = responseObj.panValidation.panStatus;
            checkUserProceedStatus(panStatus, globals);
          } else {
            errStack.errorText = 'PAN validation unsuccessful.';
            throw errStack;
          }
        } else {
          errStack.errorText = 'PAN validation API error.';
          throw errStack;
        }
      },
      /**
       * Callback function for failed PAN validation response.
       * @param {Object} errorObj - The error object containing details of the failure.
       */
      errorCallBack: (errorObj) => {
        const ccWizardView = globals.form.corporateCardWizardView;
        const resultPanel = globals.form.resultPanel;
        const tryAgainButtonErrorPanel = globals.form.resultPanel.errorResultPanel.tryAgainButtonErrorPanel;
        const ccWizardViewBlock = formUtil(globals, ccWizardView);
        const resultPanelBlock = formUtil(globals, resultPanel);
        const tryAgainButtonErrorPanelBlock = formUtil(globals, tryAgainButtonErrorPanel);
        const panels = {
          hidePanels: [ccWizardViewBlock],
          showPanels: [resultPanelBlock, tryAgainButtonErrorPanelBlock],
        };
        showErrorPanel(panels, errorObj?.errorText);
        const reloadBtn = document.getElementsByName('tryAgainButtonErrorPanel')?.[0];
        reloadBtn.addEventListener('click', () => window.location.reload());
      },
    },
  };
  // Call PANValidationAndNameMatchService with PAN validation request and event handlers
  // PANValidationAndNameMatchService(panValidation.createRequestObj(), panValidation.eventHandlers);
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
  pinMasterConstants?.forEach(
    (field) => field.pincodeField.$value && pinmasterApi(globals, field.cityField, field.stateField, field.pincodeField),
  );
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

/**
 * Creates a DAP request object based on the provided global data.
 * @param {Object} globals - The global object containing necessary data for DAP request.
 * @returns {Object} - The DAP request object.
 */
const createDapRequestObj = (globals) => {
  const genderMap = {
    1: 'M',
    2: 'F',
    3: 'T',
  };
  const {
    personalDetails,
    employmentDetails,
  } = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage;
  const formContextCallbackData = globals.functions.exportData()?.currentFormContext;
  const customerInfo = currentFormContext?.executeInterfaceReqObj?.requestString || formContextCallbackData?.executeInterfaceReqObj?.requestString;
  const { prefilledEmploymentDetails } = employmentDetails;
  const dapRequestObj = {
    requestString: {
      APS_FIRST_NAME: personalDetails.firstName.$value,
      APS_LAST_NAME: personalDetails.lastName.$value,
      APS_MIDDLE_NAME: personalDetails.middleName.$value,
      panNo: personalDetails.panNumberPersonalDetails.$value,
      dateOfBirth: dateFormat(personalDetails.dobPersonalDetails.$value, 'YYYYMMDD'),
      // duplicate
      panNumber: personalDetails.panNumberPersonalDetails.$value,
      mobileNo: globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value,
      existingCustomer: currentFormContext.journeyType === 'ETB' ? 'Y' : 'N',
      APS_NAME_AS_CARD: customerInfo.nameOnCard,
      emailAddress: prefilledEmploymentDetails.workEmailAddress.$value,
      APS_PER_ADDRESS_1: customerInfo.permanentAddress1,
      APS_PER_ADDRESS_2: customerInfo.permanentAddress2,
      APS_PER_ADDRESS_3: customerInfo.permanentAddress3,
      APS_COM_ADDRESS_1: customerInfo.communicationAddress1,
      APS_COM_ADDRESS_2: customerInfo.communicationAddress2,
      APS_COM_ADDRESS_3: customerInfo.communicationAddress3,
      APS_OFF_ADDRESS_1: customerInfo.officeAddress1,
      APS_OFF_ADDRESS_2: customerInfo.officeAddress2,
      APS_OFF_ADDRESS_3: customerInfo.officeAddress3,
      APS_COM_ZIP: customerInfo.comCityZip,
      APS_COM_STATE: customerInfo.communicationState,
      APS_PER_ZIP: customerInfo.permanentZipCode,
      APS_OFF_ZIP: customerInfo.officeZipCode,
      APS_PER_CITY: customerInfo.permanentCity,
      APS_COM_CITY: customerInfo.communicationCity,
      APS_OFF_CITY: customerInfo.officeCity,
      APS_OFF_STATE: customerInfo.officeState,
      APS_PER_STATE: customerInfo.permanentState,
      // duplicate
      APS_DATE_OF_BIRTH: dateFormat(personalDetails.dobPersonalDetails.$value, 'YYYYMMDDWithTime'),
      APS_EDUCATION: '3',
      APS_GENDER: genderMap[customerInfo.gender],
      APS_OCCUPATION: '1',
      APS_GROSS_MONTHLY_INCOME: '',
      APS_COMPANY_NAME: customerInfo.companyName,
      APS_PER_ADDR_TYPE: customerInfo.perAddressType,
      APS_RESI_TYPE: '2',
      APS_COM_ADDR_TYPE: '2',
      APS_SELF_CONFIRMATION: customerInfo.selfConfirmation,
      APS_MOBILE_EDIT_FLAG: customerInfo.mobileEditFlag,
      APS_EMAIL_EDIT_FLAG: customerInfo.apsEmailEditFlag,
      APS_PAN_EDIT_FLAG: customerInfo.panEditFlag,
      APS_ADDRESS_EDIT_FLAG: customerInfo.addressEditFlag,
      APS_NAME_EDIT_FLAG: customerInfo.nameEditFlag,
      APS_RESPHONE_EDIT_FLAG: customerInfo.resPhoneEditFlag,
      APS_OFFPHONE_EDIT_FLAG: 'N',
      APS_EMP_CODE: '',
      APS_DESIGNATION: prefilledEmploymentDetails.designation.$value,
      APS_DEPARTMENT: '',
      APS_FILLER2: 'No',
      APS_FILLER10: 'N',
      APS_OFFER_5: '',
      APS_CHANNEL: '',
      APS_BRANCH_NAME: '',
      APS_BRANCH_CITY: '',
      APS_LEAD_GENERATER: '',
      APS_LEAD_CLOSURES: '',
      APS_APPLYING_BRANCH: '',
      APS_FILLER6: '',
      APS_SMCODE: '',
      APS_DSE_CODE: '',
      applicationERefNumber: currentFormContext?.ipaResponse?.ipa?.eRefNumber || formContextCallbackData?.ipaResponse?.ipa?.eRefNumber,
      SOA_REQUESTID: '0305245144',
      nameOfDirector: '',
      relationship: '',
      product: currentFormContext?.productDetails?.product || formContextCallbackData?.productDetails?.product,
      APS_TYPE_OF_INDUSTRY: '',
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      userAgent: navigator.userAgent,
      timeInfo: new Date().toISOString(),
      APS_OFF_EMAILID: prefilledEmploymentDetails.workEmailAddress.$value,
      APS_DIRECT_DEBIT: '',
      customerId: customerInfo.customerID,
      pricingDetails: '',
      docUpload: '',
      idcomEnabled: true,
      APS_CAPTCHA: '',
      applRefNo: currentFormContext?.ipaResponse?.ipa?.applRefNumber || formContextCallbackData?.ipaResponse?.ipa?.applRefNumber,
      txnRefNo: '',
      pseudoID: '',
      FILLER8: currentFormContext?.ipaResponse?.ipa?.filler8 || formContextCallbackData?.ipaResponse?.ipa?.filler8,
      Id_token_jwt: currentFormContext.jwtToken || formContextCallbackData.jwtToken,
      IDCOM_Token: '',
      JSCPAYLOAD: '',
      BROWSERFINGERPRINT: 'ef3036d9e4872df7e5a5eb2fe49bc8ae',
      HDIMPAYLOAD: '',
    },
  };
  return dapRequestObj;
};

const updatePanelVisibility = (response, globals) => {
  const corporateCardWizardView = formUtil(globals, globals.form.corporateCardWizardView);
  const confirmAndSubmitPanel = formUtil(globals, globals.form.corporateCardWizardView.confirmAndSubmitPanel);
  const successResultPanel = formUtil(globals, globals.form.resultPanel.successResultPanel);
  const errorResultPanel = formUtil(globals, globals.form.resultPanel.errorResultPanel);
  const resultPanel = formUtil(globals, globals.form.resultPanel);
  corporateCardWizardView.visible(false);
  confirmAndSubmitPanel.visible(false);
  resultPanel.visible(true);

  if (response?.finalDap?.errorCode === '0000') {
    successResultPanel.visible(true);
    errorResultPanel.visible(false);
  } else {
    errorResultPanel.visible(true);
  }
};

/**
 * Initiates a final DAP process by making a REST API call.
 * @param {Object} globals - The global object containing necessary data for DAP request.
 * @returns {void}
 */
const finalDap = (globals) => {
  const dapRequestObj = createDapRequestObj(globals);
  const apiEndPoint = urlPath('/content/hdfc_ccforms/api/pacc/finaldapandpdfgen.json');
  const eventHandlers = {
    successCallBack: (response) => {
      console.log(response);
      updatePanelVisibility(response, globals);
    },
    errorCallBack: (response) => {
      console.log(response);
      updatePanelVisibility(response, globals);
    },
  };
  restAPICall('', 'POST', dapRequestObj, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack, 'Loading');
};

/**
 * Invokes journey APIs
 * @name invokeJourneyDropOffCall to log on success and error call backs of api calls.
 * @param {string} state
 * @param {string} mobileNumber
 * @param {string} linkName
 * @param {string} operation
 * @param {Object} globals - globals variables object containing form configurations.
 * @returns {Promise}
 */
const invokeJourneyDropOffCall = async (state, mobileNumber, linkName, operation, globals) => {
  if (state !== '') {
    currentFormContext.journeyState = state;
  }
  switch (operation) {
    case 'create': {
      return invokeJourneyDropOff(mobileNumber, currentFormContext, globals);
    }
    case 'update': {
      return invokeJourneyDropOffUpdate(mobileNumber, linkName, currentFormContext, globals);
    }
    default: {
      return null;
    }
  }
};

/**
 * @name journeyResponseHandler
 * @param {string} payload.
 */
function journeyResponseHandler(payload) {
  currentFormContext.leadProfile = journeyResponseHandlerUtil(String(payload.leadProfileId), currentFormContext)?.leadProfile;
}

/**
 * logic hanlding during prefill of form.
 * @param {object} globals - The global object containing necessary globals form data.
 */
const prefillForm = (globals) => {
  const formData = globals?.functions?.exportData();
  const {
    welcomeText,
    resultPanel,
    loginPanel,
    consentFragment,
    getOTPbutton,
    resultPanel: {
      errorResultPanel: {
        errorMessageText,
        resultSetErrorText1,
        resultSetErrorText2,
      },
    },
  } = globals.form;
  const showPanel = [resultPanel, errorMessageText, resultSetErrorText1, resultSetErrorText2]?.map((fieldName) => formUtil(globals, fieldName));
  const hidePanel = [loginPanel, welcomeText, consentFragment, getOTPbutton]?.map((fieldName) => formUtil(globals, fieldName));
  if (!formData?.form?.login?.registeredMobileNumber) {
    // show error pannel if corporate credit card details not present
    showPanel?.forEach((panel) => panel.visible(true));
    hidePanel?.forEach((panel) => panel.visible(false));
    const response = invokeJourneyDropOffCall('CRM_LEAD_FAILURE', '9999999999', '', 'create', globals);
  }
};

/**
 * @name invokeJourneyDropOff to log on success and error call backs of api calls
 * @param {string} mobileNumber
 * @param {object} currentFormContext
 * @param {object} globals - globals variables object containing form configurations.
 */
function invokeJourneyDropOffA(mobileNumber, globals) {
  return invokeJourneyDropOffB(mobileNumber, globals);
}

export {
  getThisCard,
  prefillForm,
  currentFormContext,
  createPanValidationRequest,
  getAddressDetails,
  pinCodeMaster,
  validateEmailID,
  currentAddressToggleHandler,
  finalDap,
  otpValHandler,
  journeyResponseHandler,
  invokeJourneyDropOffCall,
  createJourneyId,
  invokeJourneyDropOffA,
};
