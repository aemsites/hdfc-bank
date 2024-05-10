/* eslint-disable no-console */
import {
  urlPath,
  moveWizardView,
  formUtil,
  composeNameOption,
  setSelectOptions,
  dateFormat,
} from './formutils.js';
import { currentFormContext } from './journey-utils.js';
import {
  restAPICall,
  getJsonResponse,
  hideLoader,
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
const createExecuteInterfaceRequestObj = (panCheckFlag, globals, breDemogResponse) => {
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
      permanentAddress.address1 = permanentAddressPanel.permanentAddressLine1.$value;
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
      panCheckFlag,
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
      eReferenceNumber: breDemogResponse?.BREFILLER3,
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
  const { firstName, middleName, lastName } = currentFormContext.customerName;
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
  hideLoader();
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
  const { cardBenefitsTextBox } = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.cardBenefitsFeaturesPanel;
  const cardBenefitsTextField = formUtil(globals, cardBenefitsTextBox);
  cardBenefitsTextField.setValue(response.productEligibility.productDetails[0].keyBenefits[0]);
  hideLoader();
  listNameOnCard(globals);
};

/**
 * Restart the journey.
 * @param {object} globals - globals variables object containing form configurations.
 */
const journeyRestart = (globals) => {
  hideLoader();
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
  executeInterfaceApi: async (APS_PAN_CHK_FLAG, globals, breDemogResponse) => {
    const requestObj = createExecuteInterfaceRequestObj(APS_PAN_CHK_FLAG, globals, breDemogResponse);
    currentFormContext.executeInterfaceReqObj = requestObj;
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
  const customerInfo = currentFormContext.executeInterfaceReqObj.requestString;
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
      APS_NAME_AS_CARD: currentFormContext.executeInterfaceReqObj.requestString.nameOnCard,
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
      APS_MOBILE_EDIT_FLAG: currentFormContext.executeInterfaceReqObj.requestString.mobileEditFlag,
      APS_EMAIL_EDIT_FLAG: currentFormContext.executeInterfaceReqObj.requestString.apsEmailEditFlag,
      APS_PAN_EDIT_FLAG: currentFormContext.executeInterfaceReqObj.requestString.panEditFlag,
      APS_ADDRESS_EDIT_FLAG: currentFormContext.executeInterfaceReqObj.requestString.addressEditFlag,
      APS_NAME_EDIT_FLAG: currentFormContext.executeInterfaceReqObj.requestString.nameEditFlag,
      APS_RESPHONE_EDIT_FLAG: currentFormContext.executeInterfaceReqObj.requestString.resPhoneEditFlag,
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
      applicationERefNumber: currentFormContext.ipaResponse.ipa.eRefNumber,
      SOA_REQUESTID: '0305245144',
      nameOfDirector: '',
      relationship: '',
      product: 'Regalia Gold',
      APS_TYPE_OF_INDUSTRY: '',
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      userAgent: navigator.userAgent,
      timeInfo: new Date().toISOString(),
      APS_OFF_EMAILID: prefilledEmploymentDetails.workEmailAddress.$value,
      APS_DIRECT_DEBIT: '',
      customerId: currentFormContext.executeInterfaceReqObj.requestString.customerID,
      pricingDetails: '',
      docUpload: '',
      idcomEnabled: true,
      APS_CAPTCHA: '',
      applRefNo: currentFormContext.ipaResponse.ipa.applRefNumber,
      txnRefNo: '',
      pseudoID: '',
      FILLER8: currentFormContext.ipaResponse.ipa.filler8,
      Id_token_jwt: currentFormContext.jwtToken,
      IDCOM_Token: '',
      JSCPAYLOAD: '',
      BROWSERFINGERPRINT: 'ef3036d9e4872df7e5a5eb2fe49bc8ae',
      HDIMPAYLOAD: '',
    },
  };
  return dapRequestObj;
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
    },
    errorCallBack: (response) => {
      console.log(response);
    },
  };
  restAPICall('', 'POST', dapRequestObj, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack, 'Loading');
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
const fetchAuthCode = (globals) => {
  const idComObj = createIdComRequestObj();
  const apiEndPoint = urlPath('/content/hdfc_commonforms/api/fetchauthcode.json');
  const eventHandlers = {
    successCallBack: (response) => {
      console.log(response);
      finalDap(globals);
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
  const requestObj = currentFormContext.executeInterfaceReqObj;
  requestObj.requestString.nameOnCard = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.CorporatetImageAndNamePanel.nameOnCardDropdown.$value;
  requestObj.requestString.Id_token_jwt = currentFormContext.jwtToken;
  currentFormContext.executeInterfaceReqObj.requestString.productCode = currentFormContext.productCode;
  const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/executeinterface.json');
  const eventHandlers = {
    successCallBack: (response) => {
      console.log(response);
      fetchAuthCode(globals);
    },
    errorCallBack: (response) => {
      console.log(response);
    },
  };
  restAPICall('', 'POST', requestObj, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack, 'Loading');
};

export {
  customerValidationHandler,
  executeInterfaceApiFinal,
};
