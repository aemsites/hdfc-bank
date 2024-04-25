/* eslint-disable no-console */
import parseCustomerAddress from './formutils.js';

const createExecuteInterfaceRequestObj = (globals, journeyType, breDemogResponse) => {
  const {
    personalDetails,
    currentDetails,
    employmentdetails,
  } = globals.form.corporateCardWizardView.yourDetailsPanel;
  const { prefilledemploymentdetails } = employmentdetails;
  let isAddressEditFlag = 'Y';
  const panEditFlag = 'Y';
  const currentAddress = {
    communicationAddress1: '',
    communicationAddress2: '',
    communicationAddress3: '',
    city: '',
    pincode: '',
    state: '',
  };
  let permanentAddress = {
    communicationAddress1: '',
    communicationAddress2: '',
    communicationAddress3: '',
    city: '',
    pincode: '',
    state: '',
  };
  if (journeyType === 'ETB') {
    if (document.getElementsByName('currentAddressToggle')[0].checked) {
      const { currentAddressETB } = currentDetails;
      currentAddress.communicationAddress1 = currentAddressETB.addressLine1.$value;
      currentAddress.communicationAddress2 = currentAddressETB.addressLine2.$value;
      currentAddress.communicationAddress3 = currentAddressETB.addressLine3.$value;
      currentAddress.city = currentAddressETB.city;
      currentAddress.pincode = currentAddressETB.currentaddrespincodentb;
      currentAddress.state = currentAddressETB.state;
    } else {
      const customerFiller2 = breDemogResponse?.BREFILLER2?.toUpperCase();
      if (customerFiller2 === 'D106') {
        const customerValidAddress = parseCustomerAddress(`${breDemogResponse?.VDCUSTADD1} ${breDemogResponse?.VDCUSTADD2} ${breDemogResponse?.VDCUSTADD3}`);
        [currentAddress.communicationAddress1, currentAddress.communicationAddress2, currentAddress.communicationAddress3] = customerValidAddress;
      } else {
        isAddressEditFlag = 'N';
        currentAddress.communicationAddress1 = breDemogResponse?.VDCUSTADD1;
        currentAddress.communicationAddress2 = breDemogResponse?.VDCUSTADD2;
        currentAddress.communicationAddress3 = breDemogResponse?.VDCUSTADD3;
        currentAddress.city = breDemogResponse.VDCUSTCITY;
        currentAddress.pincode = breDemogResponse.VDCUSTZIPCODE;
        currentAddress.state = breDemogResponse.VDCUSTSTATE;
      }
    }
  } else {
    const { currentAddressNTB } = currentDetails;
    currentAddress.communicationAddress1 = currentAddressNTB.addressLine1.$value;
    currentAddress.communicationAddress2 = currentAddressNTB.addressLine2.$value;
    currentAddress.communicationAddress3 = currentAddressNTB.addressLine3.$value;
    currentAddress.city = currentAddressNTB.city;
    currentAddress.pincode = currentAddressNTB.currentaddrespincodentb;
    currentAddress.state = currentAddressNTB.state;
  }
  if (document.getElementsByName('permanentaddresspanel')[0].checked) {
    permanentAddress = { ...currentAddress };
  } else {
    console.log(permanentAddress);
  }
  const requestObj = {
    requestString: {
      bankEmployee: 'N',
      mobileNumber: globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value,
      fullName: `${personalDetails.firstName.$value} ${personalDetails.middleName.$value} ${personalDetails.lastName.$value}`,
      panCheckFlag: 'Y',
      perAddressType: '2',
      personalEmailId: personalDetails.personalEmailAddress.$value,
      selfConfirmation: 'N',
      addressEditFlag: isAddressEditFlag,
      communicationAddress1: currentAddress.communicationAddress1,
      communicationAddress2: currentAddress.communicationAddress1,
      communicationCity: currentAddress.city,
      dateOfBirth: personalDetails.dobPersonalDetails.$value,
      firstName: personalDetails.firstName.$value,
      lastName: personalDetails.lastName.$value,
      gender: personalDetails.gender.$value,
      occupation: '5',
      officialEmailId: prefilledemploymentdetails.workemailaddress.$value,
      panEditFlag,
      panNumber: 'RTRPG1801Q',
      permanentAddress1: 'A 20 Building A705',
      permanentAddress2: 'Adani Estate',
      permanentCity: 'NAVI MUMBAI',
      permanentZipCode: '400709',
      eReferenceNumber: 'AD0952400002',
      nameEditFlag: 'N',
      mobileEditFlag: 'N',
      resPhoneEditFlag: 'N',
      comAddressType: '2',
      comCityZip: '400709',
      customerID: 'XXXXX6807',
      timeInfo: new Date().toISOString(),
      Id_token_jwt: '',
      communicationAddress3: currentAddress.communicationAddress3,
      permanentAddress3: 'Nashik Road',
      officeAddress1: '',
      officeAddress2: '',
      officeAddress3: '',
      officeCity: '',
      officeZipCode: '',
      officeState: '',
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
      companyName: '',
      departmentOrEmpCode: '',
      designation: '',
      middleName: 'Deelip',
      perfiosTxnID: '',
      monthlyincome: '',
      annualItr: '',
      permanentState: 'MAHARASHTRA',
      communicationState: 'MAHARASHTRA',
      authMode: '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      journeyID: '16cb3ad2-4e87-4bc7-8ef6-8e4421099a33_01_ETBWOCC_U_WEB',
      journeyName: 'ETBWO_CC_JOURNEY',
      nameOnCard: 'Shubham Sonawane',
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
  executeInterfaceApi: (APS_PAN_CHK_FLAG, globals, journeyType, breDemogResponse) => {
    console.log(`APS_PAN_CHK_FLAG: ${APS_PAN_CHK_FLAG} and called executeInterfaceApi()`);
    createExecuteInterfaceRequestObj(globals, journeyType, breDemogResponse);
  },

  terminateJourney: (panStatus) => {
    console.log(`pan Status: ${panStatus} and called terminateJourney()`);
  },

  restartJourney: (panStatus) => {
    console.log(`pan Status: ${panStatus} and called restartJourney()`);
  },
};

export default customerValidationHandler;
