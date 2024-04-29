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
import { restAPICall } from './makeRestAPI.js';

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
    if (document.getElementsByName('currentAddressToggle')[0].checked) {
      const { newcurentaddresspanel } = currentDetails.currentAddressETB;
      currentAddress.address1 = newcurentaddresspanel.newCurentAddressLine1.$value;
      currentAddress.address2 = newcurentaddresspanel.newCurentAddressLine2.$value;
      currentAddress.address3 = newcurentaddresspanel.newCurentAddressLine3.$value;
      currentAddress.city = newcurentaddresspanel.newCurentAddressCity.$value;
      currentAddress.pincode = newcurentaddresspanel.newCurentAddressPin.$value;
      currentAddress.state = newcurentaddresspanel.newCurentAddressState.$value;
    } else {
      const customerFiller2 = breDemogResponse?.BREFILLER2?.toUpperCase();
      if (customerFiller2 === 'D106') {
        const customerValidAddress = parseCustomerAddress(`${breDemogResponse?.VDCUSTADD1} ${breDemogResponse?.VDCUSTADD2} ${breDemogResponse?.VDCUSTADD3}`);
        [currentAddress.address1, currentAddress.address2, currentAddress.address3] = customerValidAddress;
        currentAddress.city = breDemogResponse.VDCUSTCITY;
        currentAddress.pincode = breDemogResponse.VDCUSTZIPCODE;
        currentAddress.state = breDemogResponse.VDCUSTSTATE;
      } else {
        isAddressEditFlag = 'N';
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
      nameOnCard: fullName,
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
 * @param {string} firstName - The first name of the cardholder.
 * @param {string} middleName - The last name of the cardholder.
 * @param {string} lastName - The last name of the cardholder.
 * @param {object} globals - globals variables object containing form configurations.
 */
const listNameOnCard = (firstName, middleName, lastName, globals) => {
  const elementNameSelect = 'nameOnCardDropdown';
  const dropDownSelectField = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.CorporatetImageAndNamePanel.nameOnCardDropdown;
  const options = composeNameOption(firstName, middleName, lastName);
  const initialValue = options[0]?.value;
  setSelectOptions(options, elementNameSelect);
  const setDropdownField = formUtil(globals, dropDownSelectField);
  setDropdownField.setEnum(options, initialValue); // setting initial value
  moveWizardView('corporateCardWizardView', 'confirmCardPanel');
};

const sendIpaRequest = (ipaRequestObj, globals) => {
  const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/ipa.json');
  if (TOTAL_TIME >= currentFormContext.ipaDuration * 1000) {
    console.log('terminate journey');
    return;
  }
  const eventHandlers = {
    successCallBack: (response) => {
      if (response.ipa.ipaResult === '' || response.ipa.ipaResult === null) {
        setTimeout(() => sendIpaRequest(ipaRequestObj, globals), currentFormContext.ipaTimer * 1000);
        TOTAL_TIME += currentFormContext.ipaTimer * 1000;
      } else {
        currentFormContext.productDetails = response.productEligibility.productDetails?.[0];
        const { cardBenefitsTextBox } = globals.form.corporateCardWizardView.confirmCardPanel.cardBenefitsPanel.cardBenefitsFeaturesPanel;
        const cardBenefitsTextField = formUtil(globals, cardBenefitsTextBox);
        cardBenefitsTextField.setValue(response.productEligibility.productDetails[0].keyBenefits[0]);
        const { firsName, middleName, lastName } = currentFormContext.customerName;
        listNameOnCard(firsName, middleName, lastName, globals);
      }
    },
    errorCallBack: (response) => {
      console.log(response);
    },
  };
  restAPICall('', 'POST', ipaRequestObj, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack, 'Loading');
};

const customerValidationHandler = {
  executeInterfaceApi: (APS_PAN_CHK_FLAG, globals, breDemogResponse) => {
    const requestObj = createExecuteInterfaceRequestObj(APS_PAN_CHK_FLAG, globals, breDemogResponse);
    const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/executeinterface.json');
    const eventHandlers = {
      successCallBack: (response) => {
        if (response.errorCode === '0000') {
          currentFormContext.ipaDuration = response.ExecuteInterfaceResponse.ipaDuration;
          currentFormContext.ipaTimer = response.ExecuteInterfaceResponse.ipaTimer;
          const ipaRequestObj = {
            requestString: {
              mobileNumber: globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value,
              applRefNumber: response.ExecuteInterfaceResponse.applicationRefNumber,
              eRefNumber: response.ExecuteInterfaceResponse.eRefNumber,
              Id_token_jwt: response.Id_token_jwt,
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
        }
      },
      errorCallBack: (response) => {
        console.log(response);
      },
    };
    restAPICall('', 'POST', requestObj, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack, 'Loading');
  },

  terminateJourney: (panStatus) => {
    console.log(`pan Status: ${panStatus} and called terminateJourney()`);
  },

  restartJourney: (panStatus) => {
    console.log(`pan Status: ${panStatus} and called restartJourney()`);
  },
};

export default customerValidationHandler;
