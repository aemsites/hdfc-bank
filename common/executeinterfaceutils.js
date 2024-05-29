/* eslint-disable no-console */
import {
  urlPath,
  moveWizardView,
  formUtil,
  composeNameOption,
  setSelectOptions,
} from './formutils.js';
import { currentFormContext } from './journey-utils.js';
import {
  restAPICall,
  getJsonResponse,
  fetchJsonResponse,
  fetchIPAResponse,
  hideLoaderGif,
} from './makeRestAPI.js';

const GENDER_MAP = {
  M: '1',
  F: '2',
  O: '3',
  1: '1',
  2: '2',
  3: '3',
  Male: '1',
  Female: '2',
  Other: '3',
  T: '3',
};
let TOTAL_TIME = 0;
const formatDate = (inputDate) => {
  const date = new Date(inputDate);

  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' }).substring(0, 3);
  const year = date.getFullYear();

  const formattedDate = `${day}-${month}-${year}`;

  return formattedDate;
};

/**
 * Creates an Execute Interface request object based on the provided global data.
 * @param {Object} globals - The global object containing necessary data for ExecuteInterface request.
 * @returns {Object} - The ExecuteInterface request object.
 */
const createExecuteInterfaceRequestObj = (globals) => {
  const { breDemogResponse } = currentFormContext;
  const {
    personalDetails,
    currentDetails,
    employmentDetails,
  } = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage;
  const { prefilledEmploymentDetails } = employmentDetails;
  const fullName = `${personalDetails.firstName.$value} ${personalDetails.middleName.$value} ${personalDetails.lastName.$value}`;
  let addressEditFlag = 'N';
  let panEditFlag = 'N';
  const panNumber = personalDetails.panNumberPersonalDetails.$value;
  let nameEditFlag = 'N';
  const currentAddress = {
    address1: '',
    address2: '',
    address3: '',
    city: '',
    pincode: '',
    state: '',
  };
  let permanentAddress = { ...currentAddress };
  if (currentFormContext.journeyType === 'ETB') {
    if (breDemogResponse?.VDCUSTITNBR !== panNumber) {
      panEditFlag = 'Y';
    }
    if (breDemogResponse.VDCUSTFULLNAME !== fullName) {
      nameEditFlag = 'Y';
    }
    const customerFiller2 = breDemogResponse?.BREFILLER2?.toUpperCase();
    if (customerFiller2 === 'D106') {
      [currentAddress.address1, currentAddress.address2, currentAddress.address3] = currentFormContext.customerParsedAddress;
      currentAddress.city = breDemogResponse.VDCUSTCITY;
      currentAddress.pincode = breDemogResponse.VDCUSTZIPCODE;
      currentAddress.state = breDemogResponse.VDCUSTSTATE;
    } else {
      currentAddress.address1 = breDemogResponse?.VDCUSTADD1;
      currentAddress.address2 = breDemogResponse?.VDCUSTADD2;
      currentAddress.address3 = breDemogResponse?.VDCUSTADD3;
      currentAddress.city = breDemogResponse.VDCUSTCITY;
      currentAddress.pincode = breDemogResponse.VDCUSTZIPCODE;
      currentAddress.state = breDemogResponse.VDCUSTSTATE;
    }
    if (currentDetails.currentAddressETB.currentAddressToggle.$value === 'on') {
      addressEditFlag = 'Y';
      const { newCurentAddressPanel } = currentDetails.currentAddressETB;
      permanentAddress.address1 = newCurentAddressPanel.newCurentAddressLine1.$value;
      permanentAddress.address2 = newCurentAddressPanel.newCurentAddressLine2.$value;
      permanentAddress.address3 = newCurentAddressPanel.newCurentAddressLine3.$value;
      permanentAddress.city = newCurentAddressPanel.newCurentAddressCity.$value;
      permanentAddress.pincode = newCurentAddressPanel.newCurentAddressPin.$value;
      permanentAddress.state = newCurentAddressPanel.newCurentAddressState.$value;
    } else {
      permanentAddress = { ...currentAddress };
    }
  } else {
    panEditFlag = 'Y';
    nameEditFlag = 'Y';
    addressEditFlag = 'Y';
    const { currentAddressNTB } = currentDetails;
    const { permanentAddressPanel } = currentAddressNTB.permanentAddress;
    currentAddress.address1 = currentAddressNTB.addressLine1.$value;
    currentAddress.address2 = currentAddressNTB.addressLine2.$value;
    currentAddress.address3 = currentAddressNTB.addressLine3.$value;
    currentAddress.city = currentAddressNTB.city.$value;
    currentAddress.pincode = currentAddressNTB.currentAddresPincodeNTB.$value;
    currentAddress.state = currentAddressNTB.state.$value;
    if (currentAddressNTB.permanentAddress.permanentAddressToggle.$value === 'on') {
      permanentAddress = { ...currentAddress };
    } else {
      permanentAddress.address1 = permanentAddressPanel.permanentAddressAddress1.$value;
      permanentAddress.address2 = permanentAddressPanel.permanentAddressLine2.$value;
      permanentAddress.address3 = permanentAddressPanel.permanentAddressLine3.$value;
      permanentAddress.city = permanentAddressPanel.permanentAddressCity.$value;
      permanentAddress.pincode = permanentAddressPanel.permanentAddressPincode.$value;
      permanentAddress.state = permanentAddressPanel.permanentAddressState.$value;
    }
  }
  const requestObj = {
    requestString: {
      bankEmployee: 'N',
      mobileNumber: globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value,
      fullName,
      panCheckFlag: 'Y',
      perAddressType: '2',
      personalEmailId: personalDetails.personalEmailAddress.$value,
      selfConfirmation: 'N',
      addressEditFlag,
      communicationAddress1: currentAddress.address1,
      communicationAddress2: currentAddress.address2,
      communicationCity: currentAddress.city,
      dateOfBirth: formatDate(personalDetails.dobPersonalDetails.$value),
      firstName: personalDetails.firstName.$value,
      lastName: personalDetails.lastName.$value,
      gender: GENDER_MAP[personalDetails.gender.$value],
      occupation: '5',
      officialEmailId: prefilledEmploymentDetails.workEmailAddress.$value,
      panEditFlag,
      panNumber,
      permanentAddress1: permanentAddress.address1,
      permanentAddress2: permanentAddress.address2,
      permanentCity: permanentAddress.city,
      permanentZipCode: String(permanentAddress.pincode),
      eReferenceNumber: breDemogResponse?.BREFILLER3 || currentFormContext.referenceNumber,
      nameEditFlag,
      mobileEditFlag: currentFormContext.journeyType === 'ETB' ? 'N' : 'Y',
      resPhoneEditFlag: 'N',
      comAddressType: '2',
      comCityZip: String(currentAddress.pincode),
      customerID: currentFormContext.journeyType === 'ETB' ? breDemogResponse.FWCUSTID : '',
      timeInfo: new Date().toISOString(),
      Id_token_jwt: currentFormContext.jwtToken,
      communicationAddress3: currentAddress.address3,
      permanentAddress3: permanentAddress.address3,
      officeAddress1: employmentDetails.officeAddressLine1.$value,
      officeAddress2: employmentDetails.officeAddressLine2.$value,
      officeAddress3: employmentDetails.officeAddressLine3.$value,
      officeCity: employmentDetails.officeAddressCity.$value,
      officeZipCode: employmentDetails.officeAddressPincode.$value,
      officeState: employmentDetails.officeAddressState.$value,
      productCode: '',
      leadClosures: '',
      leadGenerater: '',
      applyingBranch: 'N',
      smCode: '',
      dseCode: '',
      lc2: '',
      filler6: '',
      branchName: '',
      branchCity: '',
      companyName: prefilledEmploymentDetails.companyName.$value,
      departmentOrEmpCode: prefilledEmploymentDetails.employeeCode.$value,
      designation: prefilledEmploymentDetails.designation.$value,
      middleName: personalDetails.middleName.$value,
      perfiosTxnID: '',
      monthlyincome: '',
      annualItr: '',
      permanentState: permanentAddress.state,
      communicationState: currentAddress.state,
      authMode: '',
      userAgent: navigator.userAgent,
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      nameOnCard: fullName.length > 19 ? '' : fullName,
      dsaValue: '',
      cardsData: '',
      channelSource: '',
      isManualFlow: 'false',
      channel: '',
      apsDobEditFlag: 'N',
      apsEmailEditFlag: 'N',
      journeyFlag: currentFormContext.journeyType,
      annualIncomeOrItrAmount: '100000',
      comResidenceType: '2',
    },
  };
  return requestObj;
};

/**
 * create a list of name to be dispayed on card dropdown in confirm card screen.
 * @param {object} globals - globals variables object containing form configurations.
 */
const listNameOnCard = (globals) => {
  const elementNameSelect = 'nameOnCardDropdown';
  const { personalDetails } = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage;
  const firstName = personalDetails.firstName.$value;
  const middleName = personalDetails.middleName.$value;
  const lastName = personalDetails.lastName.$value;
  const dropDownSelectField = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.CorporatetImageAndNamePanel.nameOnCardDropdown;
  const options = composeNameOption(firstName, middleName, lastName);
  const initialValue = options[0]?.value;
  setSelectOptions(options, elementNameSelect);
  const setDropdownField = formUtil(globals, dropDownSelectField);
  setDropdownField.setEnum(options, initialValue); // setting initial value
  moveWizardView('corporateCardWizardView', 'confirmCardPanel');
};

/**
 * Terminates the journey by displaying the error/result panel.
 * @param {object} globals - globals variables object containing form configurations.
 */
const journeyTerminate = (globals) => {
  hideLoaderGif();
  const resultPanel = formUtil(globals, globals.form.resultPanel);
  const wizardPanel = formUtil(globals, globals.form.corporateCardWizardView);
  wizardPanel.visible(false);
  resultPanel.visible(true);
};

/**
 * Resumes the journey by allowing the user to proceed further.
 * @param {object} globals - globals variables object containing form configurations.
 * @param {object} response - object containing response from the previosu api call
 */
const journeyResume = (globals, response) => {
  currentFormContext.productDetails = response.productEligibility.productDetails?.[0];
  currentFormContext.ipaResponse = response;
  const imageEl = document.querySelector('.field-cardimage > picture');
  const imagePath = `https://applyonlinedev.hdfcbank.com${response.productEligibility.productDetails[0]?.cardTypePath}?width=2000&optimize=medium`;
  imageEl.childNodes[5].setAttribute('src', imagePath);
  imageEl.childNodes[3].setAttribute('srcset', imagePath);
  imageEl.childNodes[1].setAttribute('srcset', imagePath);
  const { keyBenefitsText0 } = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.cardBenefitsFeaturesPanel;
  const cardBenefitsTextField0 = formUtil(globals, keyBenefitsText0);
  const { keyBenefitsText1 } = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.cardBenefitsFeaturesPanel;
  const cardBenefitsTextField1 = formUtil(globals, keyBenefitsText1);
  const { keyBenefitsText2 } = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.cardBenefitsFeaturesPanel;
  const cardBenefitsTextField2 = formUtil(globals, keyBenefitsText2);
  cardBenefitsTextField0.setValue(response.productEligibility.productDetails[0].keyBenefits[0]);
  cardBenefitsTextField1.setValue(response.productEligibility.productDetails[0].keyBenefits[1]);
  cardBenefitsTextField2.setValue(response.productEligibility.productDetails[0].keyBenefits[2]);
  hideLoaderGif();
  listNameOnCard(globals);
};

/**
 * Restart the journey.
 * @param {object} globals - globals variables object containing form configurations.
 */
const journeyRestart = (globals) => {
  hideLoaderGif();
  const { resultPanel, corporateCardWizardView, resultPanel: { errorResultPanel } } = globals.form;
  const ccView = formUtil(globals, corporateCardWizardView);
  const resultScr = formUtil(globals, resultPanel);
  const tryAgainBtn = formUtil(globals, errorResultPanel.tryAgainButtonErrorPanel);
  const errorText1 = formUtil(globals, errorResultPanel.resultSetErrorText1);
  const errorText2 = formUtil(globals, errorResultPanel.resultSetErrorText2);
  [resultScr, tryAgainBtn].forEach((item) => item.visible(true));
  [ccView, errorText1, errorText2].forEach((item) => item.visible(false));
  const reloadBtn = document.querySelector(`[name=${errorResultPanel.tryAgainButtonErrorPanel?.$name}]`);
  reloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.reload();
  });
};

/**
 * Sends an IPA request and handles the response.
 * @param {Object} ipaRequestObj - The IPA request object containing necessary data.
 * @param {Object} globals - The global object containing necessary data for the request.
 * @returns {void}
 */
const sendIpaRequest = async (ipaRequestObj, globals) => {
  const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/ipa.json');
  const exceedTimeLimit = (TOTAL_TIME >= currentFormContext.ipaDuration * 1000);
  const method = 'POST';
  const successMethod = (respData) => {
    const ipaResult = respData?.ipa?.ipaResult;
    const promoCode = currentFormContext?.promoCode;
    const ipaResNotPresent = (ipaResult === '' || ipaResult === 'null' || !ipaResult || ipaResult === 'undefined' || ipaResult === null);
    if (exceedTimeLimit) {
      journeyResume(globals, respData);
      return;
    }
    if (ipaResNotPresent) {
      setTimeout(() => sendIpaRequest(ipaRequestObj, globals), currentFormContext.ipaTimer * 1000);
      TOTAL_TIME += currentFormContext.ipaTimer * 1000;
    } else if (promoCode === 'NA' && ipaResult === 'Y') {
      journeyTerminate(globals);
    } else {
      journeyResume(globals, respData);
    }
  };
  const errorMethod = (err) => {
    console.log(err); // api fail
    journeyRestart(globals);
  };
  try {
    const response = await getJsonResponse(apiEndPoint, ipaRequestObj, method);
    successMethod(response);
  } catch (error) {
    errorMethod(error);
  }
};

const customerValidationHandler = {
  executeInterfaceApi: async (globals) => {
    const requestObj = createExecuteInterfaceRequestObj(globals);
    currentFormContext.executeInterfaceReqObj = { ...requestObj };
    const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/executeinterface.json');
    const method = 'POST';
    const successMethod = (respData) => {
      if (respData.errorCode === '0000') {
        currentFormContext.ipaDuration = respData.ExecuteInterfaceResponse.ipaDuration;
        currentFormContext.ipaTimer = respData.ExecuteInterfaceResponse.ipaTimer;
        currentFormContext.jwtToken = respData.Id_token_jwt;
        const ipaRequestObj = {
          requestString: {
            mobileNumber: globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value,
            applRefNumber: respData.ExecuteInterfaceResponse.applicationRefNumber,
            eRefNumber: respData.ExecuteInterfaceResponse.eRefNumber,
            Id_token_jwt: respData.Id_token_jwt,
            userAgent: navigator.userAgent,
            journeyID: currentFormContext.journeyID,
            journeyName: currentFormContext.journeyName,
            productCode: currentFormContext.productCode,
          },
        };
        TOTAL_TIME = 0;
        sendIpaRequest(ipaRequestObj, globals);
      } else {
        journeyTerminate(globals);
      }
    };
    const errorMethod = (err) => {
      console.log(err); // api fail
      journeyRestart(globals);
    };
    try {
      const response = await getJsonResponse(apiEndPoint, requestObj, method);
      successMethod(response);
    } catch (error) {
      errorMethod(error);
    }
  },

  terminateJourney: (panStatus, globals) => {
    journeyTerminate(globals);
  },

  restartJourney: (panStatus, globals) => {
    journeyRestart(globals);
  },
};

/**
 * Creates an IdCom request object based on the provided global data.
 * @param {Object} globals - The global object containing necessary data for IdCom request.
 * @returns {Object} - The IdCom request object.
 */
const createIdComRequestObj = () => {
  const idComObj = {
    requestString: {
      mobileNumber: currentFormContext.executeInterfaceReqObj.requestString.mobileNumber,
      ProductCode: currentFormContext.productCode,
      PANNo: currentFormContext.executeInterfaceReqObj.requestString.panNumber,
      userAgent: navigator.userAgent,
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      scope: 'ADOBE_PACC',
    },
  };
  return idComObj;
};

/**
 * Fetches an authentication code and initiates the final DAP process upon success.
 * @param {Object} globals - The global object containing necessary data for the request.
 * @returns {void}
 */
const fetchAuthCode = () => {
  const idComObj = createIdComRequestObj();
  const apiEndPoint = urlPath('/content/hdfc_commonforms/api/fetchauthcode.json');
  const eventHandlers = {
    successCallBack: (response) => {
      console.log(response);
    },
    errorCallBack: (response) => {
      console.log(response);
    },
  };
  restAPICall('', 'POST', idComObj, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack, 'Loading');
};

/**
 * Executes the final interface API call and fetches authentication code upon success.
 * @param {Object} globals - The global object containing necessary data for the request.
 * @returns {void}
 */
const executeInterfaceApiFinal = (globals) => {
  const formCallBackContext = globals.functions.exportData()?.currentFormContext;
  const requestObj = currentFormContext.executeInterfaceReqObj || formCallBackContext?.executeInterfaceReqObj;
  requestObj.requestString.nameOnCard = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.CorporatetImageAndNamePanel.nameOnCardDropdown.$value;
  requestObj.requestString.Id_token_jwt = currentFormContext.jwtToken || formCallBackContext?.currentFormContext?.jwtToken;
  requestObj.requestString.productCode = currentFormContext.productDetails.cardProductCode || formCallBackContext?.currentFormContext?.productDetails?.cardProductCode;
  requestObj.requestString.addressEditFlag = 'N';
  requestObj.requestString.panEditFlag = 'N';
  requestObj.requestString.nameEditFlag = 'N';
  requestObj.requestString.mobileEditFlag = 'N';
  requestObj.requestString.resPhoneEditFlag = 'N';
  requestObj.requestString.apsDobEditFlag = 'N';
  requestObj.requestString.apsEmailEditFlag = 'N';
  const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/executeinterface.json');
  const eventHandlers = {
    successCallBack: (response) => {
      console.log(response);
      if (currentFormContext.journeyType === 'ETB') {
        fetchAuthCode();
      }
    },
    errorCallBack: (response) => {
      console.log(response);
    },
  };
  restAPICall('', 'POST', requestObj, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack, 'Loading');
};

/**
 * @name executeInterfaceApi
 * @param {boolean} showLoader
 * @param {boolean} hideLoader
 * @param {object} globals
 * @return {PROMISE}
 */
const executeInterfaceApi = (showLoader, hideLoader, globals) => {
  const executeInterfaceRequest = createExecuteInterfaceRequestObj(globals);
  currentFormContext.executeInterfaceReqObj = { ...executeInterfaceRequest };
  const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/executeinterface.json');
  if (showLoader) currentFormContext.executeInterface();
  return fetchJsonResponse(apiEndPoint, executeInterfaceRequest, 'POST', hideLoader);
};

/**
 * @name ipaRequestApi ipaRequestApi
 * @param {string} eRefNumber
 * @param {string} mobileNumber
 * @param {string} applicationRefNumber
 * @param {string} idTokenJwt
 * @param {string} ipaDuration
 * @param {string} ipaTimer
 * @param {boolean} showLoader
 * @param {boolean} hideLoader
 * @return {PROMISE}
 */
const ipaRequestApi = (eRefNumber, mobileNumber, applicationRefNumber, idTokenJwt, ipaDuration, ipaTimer, showLoader, hideLoader) => {
  currentFormContext.ipaDuration = ipaDuration;
  currentFormContext.ipaTimer = ipaTimer;
  currentFormContext.jwtToken = idTokenJwt;
  const ipaRequestObj = {
    requestString: {
      mobileNumber,
      applRefNumber: applicationRefNumber,
      eRefNumber,
      Id_token_jwt: idTokenJwt,
      userAgent: navigator.userAgent,
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      productCode: currentFormContext.productCode,
    },
  };
  TOTAL_TIME = 0;
  const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/ipa.json');
  if (showLoader) currentFormContext?.ipa.dispalyLoader();
  return fetchIPAResponse(apiEndPoint, ipaRequestObj, 'POST', ipaDuration, ipaTimer, hideLoader);
};

/**
 * Handles the successful response for IPA.
 *
 * @param {Object} ipa - The ipa prop in response object.
 * @param {Object} productEligibility - The product eligibility prop in response object.
 * @param {string} errorCode
 * @param {string} errorMessage
 * @param {Object} globals - The global context object containing form and view configurations.
 */
const ipaSuccessHandler = (ipa, productEligibility, errorCode, errorMessage, globals) => {
  const { productDetails } = productEligibility;
  const [firstProductDetail] = productDetails;

  currentFormContext.ipaResponse = { ipa, productEligibility };
  currentFormContext.productDetails = firstProductDetail;

  const imageEl = document.querySelector('.field-cardimage > picture');
  const imagePath = `https://applyonlinedev.hdfcbank.com${firstProductDetail?.cardTypePath}?width=2000&optimize=medium`;

  imageEl.childNodes[5].setAttribute('src', imagePath);
  imageEl.childNodes[3].setAttribute('srcset', imagePath);
  imageEl.childNodes[1].setAttribute('srcset', imagePath);

  const benefitsPanel = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.cardBenefitsFeaturesPanel;

  ['keyBenefitsText0', 'keyBenefitsText1', 'keyBenefitsText2'].forEach((key, index) => {
    const benefitsTextField = formUtil(globals, benefitsPanel[key]);
    benefitsTextField.setValue(firstProductDetail.keyBenefits[index]);
  });
  if (currentFormContext.executeInterfaceReqObj.requestString.addressEditFlag === 'N') {
    const { selectKycPanel } = globals.form.corporateCardWizardView;
    const selectKycPanelUtil = formUtil(globals, selectKycPanel);
    selectKycPanelUtil.visible(false);
  }
  hideLoaderGif();
  listNameOnCard(globals);
  const payload = {
    errorCode,
    errorMessage,
  };
  globals.functions.setProperty(globals.form.runtime.analytics, { value: JSON.stringify(payload) });
};

export {
  customerValidationHandler,
  executeInterfaceApiFinal,
  executeInterfaceApi,
  ipaRequestApi,
  ipaSuccessHandler,
};
