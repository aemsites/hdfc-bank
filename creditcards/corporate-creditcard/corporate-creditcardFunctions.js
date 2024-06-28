/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import {
  invokeJourneyDropOff,
  invokeJourneyDropOffUpdate,
  journeyResponseHandlerUtil,
  corpCreditCardContext,
  createJourneyId,
  formRuntime,
} from '../../common/journey-utils.js';
import {
  formUtil,
  urlPath,
  clearString,
  convertDateToMmmDdYyyy,
  parseCustomerAddress,
  removeSpecialCharacters,
  santizedFormDataWithContext,
  splitName,
  DOM_API,
} from '../../common/formutils.js';
import {
  getJsonResponse,
  restAPICall,
  displayLoader, hideLoaderGif,
} from '../../common/makeRestAPI.js';
import { sendAnalyticsEvent } from '../../common/analytics.js';
import {
  executeInterfaceApiFinal,
  executeInterfaceApi,
  ipaRequestApi,
  ipaSuccessHandler,
  executeInterfacePostRedirect,
  executeInterfaceResponseHandler,
} from './executeinterfaceutils.js';
import documentUpload from './docuploadutils.js';
import * as CONSTANT from '../../common/constants.js';
import * as CC_CONSTANT from './constant.js';

const { ENDPOINTS } = CONSTANT;
const { JOURNEY_NAME } = CC_CONSTANT;
const journeyNameConstant = JOURNEY_NAME;
const { currentFormContext } = corpCreditCardContext;
// Initialize all Corporate Card Journey Context Variables.
currentFormContext.journeyName = journeyNameConstant;
currentFormContext.journeyType = 'NTB';
currentFormContext.formName = 'CorporateCreditCard';
currentFormContext.errorCode = '';
currentFormContext.errorMessage = '';
currentFormContext.eligibleOffers = '';

formRuntime.getOtpLoader = currentFormContext.getOtpLoader || (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.otpValLoader = currentFormContext.otpValLoader || (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.validatePanLoader = (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.executeInterface = (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.ipa = (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.aadharInit = (typeof window !== 'undefined') ? displayLoader : false;
formRuntime.hideLoader = (typeof window !== 'undefined') ? hideLoaderGif : false;

let RESEND_OTP_COUNT = 3;
const CUSTOMER_DEMOG_DATA = {};
let BRE_DEMOG_RESPONSE = {};
const ALLOWED_CHARACTERS = '/ -,';

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
  const { personalDetails } = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage;
  const { currentAddressNTB } = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails;
  const { currentAddressETB } = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails;
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
  setTimeout(() => {
    DOM_API.addDisableClass(personaldetails);
  }, 10);
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
    formRuntime.segment = customerInfo?.SEGMENT?.toLowerCase();
    const customerType = customerCategory[formRuntime.segment];

    // Check customer type and return accordingly
    return customerType === 'ETB';
  }

  // Default case
  return null;
};

/**
 * @name otpValHandler
 * @param {Object} response
 * @param {Object} globals
 * @return {PROMISE}
 */
const otpValHandler = (response, globals) => {
  const res = {};
  res.demogResponse = response;
  currentFormContext.isCustomerIdentified = res?.demogResponse?.errorCode === '0' ? 'Y' : 'N';
  formRuntime.productCode = globals.functions.exportData().form.productCode;
  currentFormContext.promoCode = globals.functions.exportData().form.promoCode;
  currentFormContext.jwtToken = res?.demogResponse?.Id_token_jwt;
  currentFormContext.panFromDemog = res?.demogResponse?.BRECheckAndFetchDemogResponse?.VDCUSTITNBR;
  const existingCustomer = existingCustomerCheck(res);
  if (existingCustomer) {
    currentFormContext.journeyType = 'ETB';
    const etbFlowSelected = formUtil(globals, globals.form.corporateCardWizardView.yourDetailsPanel.etbFlowSelected);
    etbFlowSelected.setValue('on');
    personalDetailsPreFillFromBRE(res, globals);
  }
  DOM_API.onWizardInit();
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
  const { currentDetails } = yourDetails;
  const etb = currentDetails.currentAddressETB;
  const ntb = currentDetails.currentAddressNTB;
  const employeeDetails = yourDetails.employmentDetails;
  const confirmAddress = ccWizard.confirmAndSubmitPanel.addressDeclarationPanel;
  const addressDeclaration = confirmAddress.addressDeclarationOVD;
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

  const officeAddressFieldOVD = formUtil(globalObj, addressDeclaration.officeAddressOVD.officeAddressOVDAddress);
  const kycOfficeAddressField = formUtil(globalObj, confirmAddress.addressDeclarationOffice.officeAddressSelectKYC);
  const currentAddressFieldOVD = formUtil(globalObj, addressDeclaration.currentAddressOVD.currentAddressOVDAddress);
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
 * Moves the wizard view to the "selectKycPanel" step.
 */
const getThisCard = (globals) => {
  const isAddressChanged = currentFormContext.executeInterfaceReqObj.requestString.addressEditFlag === 'Y';
  // executeInterfaceApiFinal(globals);
  setConfirmScrAddressFields(globals);
  if (!isAddressChanged) {
    DOM_API.moveWizardView('corporateCardWizardView', 'confirmAndSubmitPanel');
    const { addressDeclarationPanel } = globals.form.corporateCardWizardView.confirmAndSubmitPanel;
    const {
      cardDeliveryAddressPanel,
      AddressDeclarationAadhar,
      addressDeclarationOffice,
      addressDeclarationText1,
      addressDeclarationText2,
      addressDeclarationOVD,
    } = addressDeclarationPanel;
    const { confirmAndSubmitTC2, continueToIDCOM, confirmAndSubmitButton } = addressDeclarationPanel.tandCPanelConfirmAndSubmit;
    const cardDeliveryAddressPanelUtil = formUtil(globals, cardDeliveryAddressPanel);
    const AddressDeclarationAadharUtil = formUtil(globals, AddressDeclarationAadhar);
    const addressDeclarationOfficeUtil = formUtil(globals, addressDeclarationOffice);
    const addressDeclarationText1Util = formUtil(globals, addressDeclarationText1);
    const addressDeclarationText2Util = formUtil(globals, addressDeclarationText2);
    const addressDeclarationOVDUtil = formUtil(globals, addressDeclarationOVD);
    const confirmAndSubmitTC2Util = formUtil(globals, confirmAndSubmitTC2);
    const continueToIDCOMUtil = formUtil(globals, continueToIDCOM);
    const confirmAndSubmitButtonUtil = formUtil(globals, confirmAndSubmitButton);
    cardDeliveryAddressPanelUtil.visible(false);
    AddressDeclarationAadharUtil.visible(false);
    addressDeclarationOfficeUtil.visible(false);
    addressDeclarationText1Util.visible(false);
    addressDeclarationText2Util.visible(false);
    addressDeclarationOVDUtil.visible(true);
    confirmAndSubmitTC2Util.visible(false);
    continueToIDCOMUtil.visible(true);
    confirmAndSubmitButtonUtil.visible(false);
  } else {
    DOM_API.moveWizardView('corporateCardWizardView', 'selectKycPanel');
  }
};

/**
 * Moves the wizard view to the "confirmAndSubmitPanel" step.
 */
const getAddressDetails = () => DOM_API.moveWizardView('corporateCardWizardView', 'confirmAndSubmitPanel');

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
    const { errorCode } = errStack;
    const defErrMessage = 'Please enter a valid pincode';
    if (errorCode === '500') {
      setPincodeField.markInvalid(false, defErrMessage);
      resetStateCityFields();
    }
  };
  const successMethod = (value) => {
    const changeDataAttrObj = { attrChange: true, value: false };
    setPincodeField.markInvalid(true, '');
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
  const { currentDetails } = yourDetails;
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
const validateEmailID = async (email, globals) => {
  const emailField = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.personalEmailAddress;
  const url = urlPath(ENDPOINTS.emailId);
  const setEmailField = formUtil(globals, emailField);
  const invalidMsg = 'Please enter valid email id.';
  const payload = {
    email,
  };
  const method = 'POST';
  try {
    const emailValid = await getJsonResponse(url, payload, method);
    if (emailValid) {
      setEmailField.markInvalid(true);
    } else {
      setEmailField.markInvalid(false, invalidMsg);
    }
  } catch (error) {
    console.error(error, 'error in emailValid');
  }
};

/**
 * @name aadharConsent123
 * @param {Object} globals - The global object containing necessary data for DAP request.
 */
const aadharConsent123 = async (globals) => {
  try {
    if (typeof window !== 'undefined') {
      const openModal = (await import('../../blocks/modal/modal.js')).default;
      const contentDomName = 'aadharConsentPopup';
      const btnWrapClassName = 'button-wrapper';
      const config = {
        content: document.querySelector(`[name = ${contentDomName}]`),
        actionWrapClass: btnWrapClassName,
        reqConsentAgree: true,
      };
      if (typeof formRuntime.aadharConfig === 'undefined') {
        formRuntime.aadharConfig = config;
      }
      await openModal(formRuntime.aadharConfig);
      DOM_API.aadharLangChange(formRuntime.aadharConfig?.content, 'English');
      config?.content?.addEventListener('modalTriggerValue', (event) => {
        const receivedData = event.detail;
        if (receivedData?.aadharConsentAgree) {
          globals.functions.setProperty(globals.form.corporateCardWizardView.selectKycPanel.selectKYCOptionsPanel.ckycDetailsContinueETBPanel.triggerAadharAPI, { value: 1 });
        }
      });
    }
  } catch (error) {
    console.error(error);
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
      },
    },
  } = globals.form;
  const showPanel = [resultPanel, errorMessageText]?.map((fieldName) => formUtil(globals, fieldName));
  const hidePanel = [loginPanel, welcomeText, consentFragment, getOTPbutton]?.map((fieldName) => formUtil(globals, fieldName));
  if (!formData?.form?.login?.registeredMobileNumber) {
    // show error pannel if corporate credit card details not present
    showPanel?.forEach((panel) => panel.visible(true));
    hidePanel?.forEach((panel) => panel.visible(false));
    invokeJourneyDropOff('CRM_LEAD_FAILURE', '9999999999', '', 'create', globals);
  }
};

/**
* sendAnalytics
* @param {string} payload
* @param {object} globals
*/
// eslint-disable-next-line no-unused-vars
function sendAnalytics(payload, globals) {
  sendAnalyticsEvent(payload, santizedFormDataWithContext(globals), currentFormContext);
}

/**
 * @name resendOTP
 * @param {Object} globals - The global object containing necessary data for DAP request.
 */
const resendOTP = (globals) => {
  const { mobilePanel: { registeredMobileNumber }, identifierPanel: { pan, dateOfBirth } } = globals.form.loginPanel;
  const mobileNo = registeredMobileNumber.$value;
  const panNo = pan.$value;
  const dob = clearString(dateOfBirth.$value);

  const errorResendOtp = (err, objectGlobals) => {
    const {
      otpPanel, submitOTP, resultPanel,
    } = objectGlobals.form;
    const hidePanel = [otpPanel, submitOTP]?.map((panel) => formUtil(objectGlobals, panel));
    const showPanel = [resultPanel]?.map((panel) => formUtil(objectGlobals, panel));
    hidePanel.forEach((item) => item.visible(false));
    showPanel.forEach((item) => item.visible(true));
  };

  const successResendOtp = (res, objectGlobals) => {
    RESEND_OTP_COUNT -= 1;
    invokeJourneyDropOffUpdate('ResendOtp', mobileNo, globals?.form.runtime.leadProifileId.$value, currentFormContext.journeyID, globals);
    if (!RESEND_OTP_COUNT) errorResendOtp(res, objectGlobals);
  };

  const payload = {
    requestString: {
      mobileNumber: String(mobileNo),
      dateOfBith: dob || '',
      panNumber: panNo || '',
      journeyID: globals.form.runtime.journeyId.$value,
      journeyName: journeyNameConstant,
      userAgent: window.navigator.userAgent,
      identifierValue: panNo || dob.$value,
      identifierName: panNo ? 'PAN' : 'DOB',
    },
  };
  const successCallback = (res, globalObj) => ((res?.otpGenResponse?.status?.errorCode === '0') ? successResendOtp(res, globalObj) : errorResendOtp(res, globalObj));
  const errorCallback = (err, globalObj) => errorResendOtp(err, globalObj);
  const loadingText = 'Please wait otp sending again...';
  const method = 'POST';
  const path = urlPath(ENDPOINTS.otpGen);
  try {
    restAPICall(globals, method, payload, path, successCallback, errorCallback, loadingText);
  } catch (error) {
    console.error(error);
  }
};

/**
 * @name checkMode - check the location
 * @param {object} globals -
 * @return {PROMISE}
 */
function checkMode(globals) {
  // debugger;
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
    const userRedirected = true;
    executeInterfacePostRedirect('idCom', userRedirected, globals);
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

export {
  getThisCard,
  prefillForm,
  corpCreditCardContext,
  formRuntime,
  getAddressDetails,
  pinCodeMaster,
  validateEmailID,
  currentAddressToggleHandler,
  otpValHandler,
  journeyResponseHandler,
  createJourneyId,
  sendAnalytics,
  aadharConsent123,
  resendOTP,
  //
  executeInterfaceApiFinal,
  executeInterfaceApi,
  ipaRequestApi,
  ipaSuccessHandler,
  executeInterfacePostRedirect,
  executeInterfaceResponseHandler,
  documentUpload,
  checkMode,
  customSetFocus,
  //
};
