/* eslint-disable no-console */
import { parseCustomerAddress, urlPath } from './formutils.js';
import { restAPICall } from './makeRestAPI.js';

const createExecuteInterfaceRequestObj = (globals, journeyType, breDemogResponse, currentFormContext, panCheckFlag) => {
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
  if (journeyType === 'ETB') {
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
      dateOfBirth: personalDetails.dobPersonalDetails.$value,
      firstName: personalDetails.firstName.$value,
      lastName: personalDetails.lastName.$value,
      gender: personalDetails.gender.$value,
      occupation: '5',
      officialEmailId: prefilledEmploymentDetails.workEmailAddress.$value,
      panEditFlag,
      panNumber,
      permanentAddress1: permanentAddress.address1,
      permanentAddress2: permanentAddress.address2,
      permanentCity: permanentAddress.city,
      permanentZipCode: permanentAddress.pincode,
      eReferenceNumber: 'AD0952400002',
      nameEditFlag,
      mobileEditFlag: journeyType === 'ETB' ? 'N' : 'Y',
      resPhoneEditFlag: 'N',
      comAddressType: '2',
      comCityZip: currentAddress.pincode,
      customerID: journeyType === 'ETB' ? breDemogResponse.FWCUSTID : '',
      timeInfo: new Date().toISOString(),
      Id_token_jwt: '',
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
    },
  };
  return requestObj;
};

const customerValidationHandler = {
  executeInterfaceApi: (APS_PAN_CHK_FLAG, globals, journeyType, breDemogResponse, currentFormContext) => {
    console.log(`APS_PAN_CHK_FLAG: ${APS_PAN_CHK_FLAG} and called executeInterfaceApi()`);
    const requestObj = createExecuteInterfaceRequestObj(globals, journeyType, breDemogResponse, currentFormContext, APS_PAN_CHK_FLAG);
    console.log(requestObj);
    const apiEndPoint = urlPath('/content/hdfc_etb_wo_pacc/api/executeinterface.json');
    const eventHandlers = {
      successCallBack: (response) => {
        console.log(response);
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
