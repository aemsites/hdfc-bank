import { CURRENT_FORM_CONTEXT, FORM_RUNTIME } from '../../common/constants.js';
import { urlPath } from '../../common/formutils.js';
import { fetchJsonResponse } from '../../common/makeRestAPI.js';
import { JOURNEY_NAME, FD_ENDPOINTS } from './constant.js';
import { SELECTED_CUSTOMER_ID } from './customeridutil.js';

const createExecuteInterfaceRequest = (payload, globals) => {
  const {
    customerInfo, journeyID, customerAddress,
  } = CURRENT_FORM_CONTEXT;
  const { reviewDetailsView } = globals.form.fdBasedCreditCardWizard.basicDetails;
  const {
    personalDetails, addressDetails, employeeAssistance, employmentDetails,
  } = reviewDetailsView;
  const { employeeAssistancePanel } = employeeAssistance;
  const addressEditFlag = addressDetails?.mailingAddressToggle?.$value !== 'on';

  function getAddress(source) {
    return {
      line1: source?.addressLine1 || '',
      line2: source?.addressLine2 || '',
      line3: source?.addressLine3 || '',
      city: source?.city || '',
      state: source?.state || '',
      zip: source?.pincode || source?.comCityZip || '',
    };
  }

  let communicationAddress = getAddress(customerAddress);
  const permanentAddress = getAddress(customerAddress);

  if (addressEditFlag) {
    const newAddressPanel = addressDetails.newCurentAddressPanel;
    communicationAddress = {
      line1: newAddressPanel.newCurrentAddressLine1.$value || '',
      line2: newAddressPanel.newCurrentAddressLine2.$value || '',
      line3: newAddressPanel.newCurrentAddressLine3.$value || '',
      city: newAddressPanel.newCurentAddressCity.$value,
      state: newAddressPanel.newCurentAddressState.$value,
      zip: newAddressPanel.newCurentAddressPin.$value,
    };
  }
  let apsEmailEditFlag = 'N';
  if (customerInfo?.refCustEmail !== personalDetails.emailID.$value) {
    apsEmailEditFlag = 'Y';
  }
  let nameOnCard = personalDetails.nameOnCard?.$value?.toUpperCase();
  if (!CURRENT_FORM_CONTEXT?.editFlags?.nameOnCard) {
    nameOnCard = personalDetails.nameOnCardDD?.$value?.toUpperCase();
  }
  const request = {
    requestString: {
      addressEditFlag: addressEditFlag || CURRENT_FORM_CONTEXT?.editFlags?.addressEdit ? 'Y' : 'N',
      annualIncomeOrItrAmount: reviewDetailsView.employmentDetails.annualIncome._data.$_value || '',
      annualItr: '',
      applyingBranch: 'N',
      apsDobEditFlag: customerInfo?.datBirthCust ? 'N' : 'Y',
      apsEmailEditFlag,
      authMode: '',
      bankEmployee: 'N',
      branchCity: employeeAssistancePanel.branchCity._data.$_value || '',
      branchName: employeeAssistancePanel.branchName._data.$_value || '',
      CCAD_Relationship_number: '',
      cardsData: '',
      channel: employeeAssistancePanel.channel._data.$_value || '',
      channelSource: '',
      communicationAddress1: communicationAddress?.line1,
      communicationAddress2: communicationAddress?.line2,
      communicationAddress3: communicationAddress?.line3,
      communicationCity: communicationAddress?.city,
      communicationState: communicationAddress?.state,
      comAddressType: '2',
      comCityZip: communicationAddress?.zip,
      comResidenceType: '2',
      companyName: '',
      customerID: SELECTED_CUSTOMER_ID?.selectedCustId?.customerID,
      // customerID: '',
      dateOfBirth: personalDetails.dateOfBirthPersonalDetails.$value,
      departmentOrEmpCode: '',
      designation: '',
      dsaValue: employeeAssistancePanel.dsaName._data.$_value || '',
      dseCode: employeeAssistancePanel.dsaCode._data.$_value,
      eReferenceNumber: CURRENT_FORM_CONTEXT.referenceNumber,
      filler6: '',
      firstName: customerInfo.customerFirstName,
      fullName: customerInfo?.customerFullName,
      gender: personalDetails.gender._data.$_value,
      // gender: '1',
      isManualFlow: 'false',
      journeyFlag: 'ETB',
      journeyID,
      journeyName: JOURNEY_NAME,
      lastName: customerInfo.customerLastName,
      leadClosures: '',
      leadGenerater: '',
      lc2: employeeAssistancePanel.lc2Code._data.$_value || '',
      middleName: customerInfo.customerMiddleName,
      mobileEditFlag: 'N',
      mobileNumber: globals.form.loginMainPanel.loginPanel.mobilePanel.registeredMobileNumber.$value,
      monthlyincome: '',
      nameEditFlag: personalDetails?.fathersFullName?.$value?.length > 0 ? 'Y' : 'N',
      nameOnCard,
      occupation: employmentDetails.employmentType._data.$_value || '1',
      officialEmailId: '',
      officeAddress1: '',
      officeAddress2: '',
      officeAddress3: '',
      officeCity: '',
      officeState: '',
      officeZipCode: '',
      panCheckFlag: 'Y',
      panEditFlag: customerInfo?.refCustItNum ? 'N' : 'Y',
      panNumber: personalDetails.panNumberPersonalDetails.$value.replace(/\s+/g, ''),
      permanentAddress1: permanentAddress?.line1,
      permanentAddress2: permanentAddress?.line2,
      permanentAddress3: permanentAddress?.line3,
      permanentCity: permanentAddress?.city,
      permanentState: permanentAddress?.state,
      permanentZipCode: permanentAddress?.zip,
      perAddressType: '2',
      perfiosTxnID: '',
      personalEmailId: personalDetails?.emailID.$value,
      productCode: '',
      resPhoneEditFlag: 'N',
      selfConfirmation: 'Y',
      smCode: employeeAssistancePanel.smCode._data.$_value || '',
      timeInfo: new Date().toISOString(),
    },
  };
  return request;
};
/**
 * Executes an interface request.
 * @name executeInterface
 * @param {object} payload - The payload for the interface request.
 * @param {boolean} showLoader - Whether to show a loader while the request is in progress.
 * @param {boolean} hideLoader - Whether to hide the loader after the request is complete.
 * @param {object} globals - The global context object.
 * @returns {Promise<object>} A promise that resolves to the response of the interface request.
 */
const executeInterface = (payload, showLoader, hideLoader, globals) => {
  const executeInterfaceRequest = createExecuteInterfaceRequest(payload, globals);
  Object.keys(executeInterfaceRequest).forEach((key) => {
    if (executeInterfaceRequest[key] === undefined) {
      executeInterfaceRequest[key] = '';
    }
  });
  const apiEndPoint = urlPath(FD_ENDPOINTS.executeInterface);
  if (showLoader) FORM_RUNTIME.executeInterface();
  return fetchJsonResponse(apiEndPoint, executeInterfaceRequest, 'POST', hideLoader);
};

export default executeInterface;