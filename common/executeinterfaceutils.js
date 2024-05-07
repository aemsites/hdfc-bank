/* eslint-disable no-console */
import {
  parseCustomerAddress,
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
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();

  const formattedDate = `${day}-${month}-${year}`;

  return formattedDate;
};

const createExecuteInterfaceRequestObj = (panCheckFlag, globals, breDemogResponse) => {
  const {
    personalDetails,
    currentDetails,
    employmentDetails,
  } = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage;
  const { prefilledEmploymentDetails } = employmentDetails;
  const fullName = `${personalDetails.firstName.$value} ${personalDetails.middleName.$value} ${personalDetails.lastName.$value}`;
  let isAddressEditFlag = 'Y';
  let panEditFlag = 'Y';
  const panNumber = personalDetails.panNumberPersonalDetails.$value;
  let nameEditFlag = 'Y';
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
    if (breDemogResponse.VDCUSTFULLNAME === fullName) {
      nameEditFlag = 'N';
    }
    if (currentDetails.currentAddressETB.currentAddressToggle.$value === 'on') {
      const { newCurentAddressPanel } = currentDetails.currentAddressETB;
      currentAddress.address1 = newCurentAddressPanel.newCurentAddressLine1.$value;
      currentAddress.address2 = newCurentAddressPanel.newCurentAddressLine2.$value;
      currentAddress.address3 = newCurentAddressPanel.newCurentAddressLine3.$value;
      currentAddress.city = newCurentAddressPanel.newCurentAddressCity.$value;
      currentAddress.pincode = newCurentAddressPanel.newCurentAddressPin.$value;
      currentAddress.state = newCurentAddressPanel.newCurentAddressState.$value;
    } else {
      isAddressEditFlag = 'N';
      const customerFiller2 = breDemogResponse?.BREFILLER2?.toUpperCase();
      if (customerFiller2 === 'D106') {
        const customerValidAddress = parseCustomerAddress(`${breDemogResponse?.VDCUSTADD1} ${breDemogResponse?.VDCUSTADD2} ${breDemogResponse?.VDCUSTADD3}`);
        [currentAddress.address1, currentAddress.address2, currentAddress.address3] = customerValidAddress;
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
      permanentAddress = { ...currentAddress };
    }
  } else {
    const { currentAddressNTB } = currentDetails;
    const { permanentaddresspanel } = currentAddressNTB.permanentaddress;
    currentAddress.address1 = currentAddressNTB.addressLine1.$value;
    currentAddress.address2 = currentAddressNTB.addressLine2.$value;
    currentAddress.address3 = currentAddressNTB.addressLine3.$value;
    currentAddress.city = currentAddressNTB.city.$value;
    currentAddress.pincode = currentAddressNTB.currentaddrespincodentb.$value;
    currentAddress.state = currentAddressNTB.state.$value;
    if (document.getElementsByName('permanentAddressToggle')[0].checked) {
      permanentAddress = { ...currentAddress };
    } else {
      permanentAddress.address1 = permanentaddresspanel.permanentAddressLine1.$value;
      permanentAddress.address2 = permanentaddresspanel.permanentAddressLine2.$value;
      permanentAddress.address3 = permanentaddresspanel.permanentAddressLine3.$value;
      permanentAddress.city = permanentaddresspanel.permanentAddressCity.$value;
      permanentAddress.pincode = permanentaddresspanel.permanentAddressPincode.$value;
      permanentAddress.state = permanentaddresspanel.permanentAddressState.$value;
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
      addressEditFlag: isAddressEditFlag,
      communicationAddress1: currentAddress.address1,
      communicationAddress2: currentAddress.address1,
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

const terminateJourney = (globals) => {
  hideLoader();
  const resultPanel = formUtil(globals, globals.form.resultPanel);
  const wizardPanel = formUtil(globals, globals.form.corporateCardWizardView);
  wizardPanel.visible(false);
  resultPanel.visible(true);
};
const resumeJourney = (globals, response) => {
  currentFormContext.productDetails = response.productEligibility.productDetails?.[0];
  const { cardBenefitsTextBox } = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.cardBenefitsFeaturesPanel;
  const cardBenefitsTextField = formUtil(globals, cardBenefitsTextBox);
  cardBenefitsTextField.setValue(response.productEligibility.productDetails[0].keyBenefits[0]);
  hideLoader();
  listNameOnCard(globals);
};

const sendIpaRequest = async (ipaRequestObj, globals) => {
  const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/ipa.json');
  const exceedTimeLimit = (TOTAL_TIME >= currentFormContext.ipaDuration * 1000);
  const method = 'POST';
  const successMethod = (respData) => {
    const ipaResult = respData?.ipa?.ipaResult;
    const promoCode = currentFormContext?.promoCode;
    const ipaResNotPresent = (ipaResult === '' || ipaResult === 'null' || !ipaResult || ipaResult === 'undefined' || ipaResult === null);
    if (exceedTimeLimit) {
      resumeJourney(globals, respData);
      return;
    }
    if (ipaResNotPresent) {
      setTimeout(() => sendIpaRequest(ipaRequestObj, globals), currentFormContext.ipaTimer * 1000);
      TOTAL_TIME += currentFormContext.ipaTimer * 1000;
    } else if (promoCode === 'NA' && ipaResult === 'Y') {
      terminateJourney(globals);
    } else {
      resumeJourney(globals, respData);
    }
  };
  const errorMethod = (err) => {
    hideLoader();
    console.log(err);
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
        console.log('terminate journey');
        hideLoader();
      }
    };
    const errorMethod = (err) => {
      hideLoader();
      console.log(err);
    };
    try {
      const response = await getJsonResponse(apiEndPoint, requestObj, method);
      successMethod(response);
    } catch (error) {
      errorMethod(error);
    }
  },

  terminateJourney: (panStatus, globals) => {
    console.log(`pan Status: ${panStatus} and called terminateJourney()`);
    hideLoader();
    terminateJourney(globals);
  },

  restartJourney: (panStatus) => {
    hideLoader();
    console.log(`pan Status: ${panStatus} and called restartJourney()`);
  },
};

const executeInterfaceApiFinal = (globals) => {
  const requestObj = currentFormContext.executeInterfaceReqObj;
  currentFormContext.executeInterfaceReqObj.requestString.productCode = currentFormContext.productCode;
  const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/executeinterface.json');
  const eventHandlers = {
    successCallBack: (response) => {
      console.log(response, globals);
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
