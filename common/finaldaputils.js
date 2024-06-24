import corpCreditCard from './constants.js';
import { formUtil, urlPath } from './formutils.js';
import { corpCreditCardContext, invokeJourneyDropOffUpdate } from './journey-utils.js';
import { restAPICall } from './makeRestAPI.js';

const getCurrentDateAndTime = (dobFormatNo) => {
  /*
      dobFormatNo: 1 (DD-MM-YYYY HH:MM:SS)
      dobFormatNo: 2 (YYYYMMDDHHMMSS)
      dobFormatNo: 3 (DDMMYYYYHHMMSS)
  */
  const newDate = new Date();
  const year = newDate.getFullYear();
  const month = newDate.getMonth() + 1;
  const todaySDate = newDate.getDate();
  const hours = newDate.getHours();
  const minutes = newDate.getMinutes();
  const seconds = newDate.getSeconds();
  let formatedTime = '';
  switch (dobFormatNo) {
    case 1:
      formatedTime = `${todaySDate}-${month}-${year} ${hours}:${minutes}:${seconds}`;
      break;
    case 2:
      formatedTime = `${year}${month}${todaySDate}${hours}${minutes}${seconds}`;
      break;
    case 3:
      formatedTime = `${todaySDate}${month}${year.toString().substring(2, 4)}${hours}${minutes}${seconds}`;
      break;
    default:
      formatedTime = '';
  }
  return formatedTime;
};

const { currentFormContext } = corpCreditCardContext;
const fetchFiller4 = (mobileMatch, kycStatus, journeyType) => {
  let filler4Value = null;
  switch (kycStatus) {
    case 'aadhaar':
      // eslint-disable-next-line no-nested-ternary
      filler4Value = (journeyType === 'NTB') ? `VKYC${getCurrentDateAndTime(3)}` : ((currentFormContext?.journeyType === 'ETB') && mobileMatch) ? `NVKYC${getCurrentDateAndTime(3)}` : `VKYC${getCurrentDateAndTime(3)}`;
      break;
    case 'bioKYC':
      filler4Value = 'bioKYC';
      break;
    case 'OVD':
      filler4Value = 'OVD';
      break;
    default:
      filler4Value = null;
  }
  return filler4Value;
};
/**
 * Creates a DAP request object based on the provided global data.
 * @param {Object} globals - The global object containing necessary data for DAP request.
 * @returns {Object} - The DAP request object.
 */
const createDapRequestObj = (globals) => {
  debugger;
  const formContextCallbackData = globals.functions.exportData()?.currentFormContext || currentFormContext;
  const segment = formContextCallbackData?.breDemogResponse?.SEGMENT || currentFormContext;
  const customerInfo = currentFormContext?.executeInterfaceReqObj?.requestString || formContextCallbackData?.executeInterfaceReqObj?.requestString;
  // const { prefilledEmploymentDetails } = employmentDetails;
  const { selectKYCMethodOption1: { aadharEKYCVerification }, selectKYCMethodOption2: { aadharBiometricVerification }, selectKYCMethodOption3: { officiallyValidDocumentsMethod } } = globals.form.corporateCardWizardView.selectKycPanel.selectKYCOptionsPanel;
  const kycFill = {
    KYC_STATUS:
        (aadharEKYCVerification.$value && 'aadhaar')
        || (aadharBiometricVerification.$value && 'bioKYC')
        || (officiallyValidDocumentsMethod.$value && 'OVD')
        || null,
  };

  const journeyType = (globals.functions.exportData()?.currentFormContext?.breDemogResponse?.BREFILLER2 === 'D101') ? 'ETB' : 'NTB';
  const mobileMatch = globals.functions.exportData()?.aadhaar_otp_val_data?.result?.mobileValid !== undefined;
  const VKYCConsent = fetchFiller4(mobileMatch, kycFill.KYC_STATUS, journeyType);
  const formData = globals.functions.exportData();
  const ekycSuccess = mobileMatch ? `${formData?.aadhaar_otp_val_data?.result?.ADVRefrenceKey}X${formData?.aadhaar_otp_val_data.result?.RRN}` : '';
  const finalDapPayload = {
    requestString: {
      applRefNumber: formContextCallbackData?.applRefNumber,
      eRefNumber: formContextCallbackData?.eRefNumber,
      customerId: customerInfo.customerID,
      communicationCity: customerInfo.communicationCity,
      idcomStatus: 'N',
      id_token_jwt: formContextCallbackData?.jwtToken || currentFormContext.jwtToken,
      motherFirstName: globals.functions.exportData()?.form?.mothersFirstName ?? '',
      motherMiddleName: globals.functions.exportData()?.form?.mothersMiddleName ?? '',
      motherLastName: globals.functions.exportData()?.form?.mothersLastName ?? '',
      ckycNumber: '',
      motherNameTitle: '',
      mobileNumber: globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value,
      userAgent: navigator.userAgent,
      journeyID: formContextCallbackData.journeyID || currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      filler7: '',
      Segment: segment,
      biometricStatus: kycFill.KYC_STATUS,
      ekycSuccess,
      VKYCConsent,
      ekycConsent: `${getCurrentDateAndTime(3)}YEnglishxeng1x0`,
    },
  };
  return finalDapPayload;
};

const updatePanelVisibility = (response, globals) => {
  const successResultPanel = formUtil(globals, globals.form.resultPanel.successResultPanel);
  const errorResultPanel = formUtil(globals, globals.form.resultPanel.errorResultPanel);
  const {
    loginPanel, consentFragment, getOTPbutton, welcomeText,
  } = globals.form;
  [loginPanel, consentFragment, getOTPbutton, welcomeText].map((el) => formUtil(globals, el)).forEach((item) => item.visible(false));

  if (true) {
    successResultPanel.visible(true);
    errorResultPanel.visible(false);
  } else {
    errorResultPanel.visible(true);
  }
};

const throughDomSetArnNum = (arnNumRef) => {
  const nameOfArnRefPanel = 'arnRefNumPanel';
  const classNamefieldArnNo = '.field-arnnumber';
  const arnRefNumPanel = document?.querySelector(`[name= ${nameOfArnRefPanel}]`);
  const arnNumberElement = arnRefNumPanel.querySelector(classNamefieldArnNo);
  if (arnNumberElement) {
    // Manipulate the content of the <p> tag inside '.field-arnnumber'
    arnNumberElement.querySelector('p').textContent = arnNumRef;
  }
};

const finalDap = (globals) => {
  debugger;
  const apiEndPoint = urlPath(corpCreditCard.endpoints.finalDap);
  const payload = createDapRequestObj(globals);
  const formContextCallbackData = globals.functions.exportData()?.currentFormContext || currentFormContext;
  const mobileNumber = globals.functions.exportData().form.login.registeredMobileNumber || globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value;
  const leadProfileId = globals.functions.exportData().leadProifileId || globals.form.runtime.leadProifileId.$value;
  const journeyId = formContextCallbackData.journeyID;
  const eventHandlers = {
    successCallBack: (response, globalObj) => {
      if (response?.errorCode === '0000') {
        currentFormContext.VKYC_URL = response.vkycUrl;
        currentFormContext.ARN_NUM = response.applicationNumber;
        currentFormContext.finalDapResponse = response;
        invokeJourneyDropOffUpdate('FINAL_DAP_SUCCESS', mobileNumber, leadProfileId, journeyId, globalObj);
        if (document) {
          globalObj.functions.setProperty(globalObj.form.corporateCardWizardView, { visible: false });
          globalObj.functions.setProperty(globalObj.form.resultPanel, { visible: true });
          globalObj.functions.setProperty(globalObj.form.resultPanel.errorResultPanel, { visible: false });
          globalObj.functions.setProperty(globalObj.form.resultPanel.successResultPanel, { visible: true });
          // 👇 it is not setting the value.
          globalObj.functions.setProperty(globalObj.form.resultPanel.successResultPanel.arnRefNumPanel.arnNumber, { value: response.applicationNumber });
          // setting through DomApi
          throughDomSetArnNum(response.applicationNumber);
        }
      } else {
        invokeJourneyDropOffUpdate('FINAL_DAP_FAILURE', mobileNumber, leadProfileId, journeyId, globalObj);
        if (document) {
          globalObj.functions.setProperty(globalObj.form.corporateCardWizardView, { visible: false });
          globalObj.functions.setProperty(globalObj.form.resultPanel, { visible: true });
          globalObj.functions.setProperty(globalObj.form.resultPanel.errorResultPanel, { visible: true });
        }
      }
    },
    errorCallback: (response, globalObj) => {
      globalObj.functions.setProperty(globalObj.form.corporateCardWizardView, { visible: false });
      globalObj.functions.setProperty(globalObj.form.resultPanel, { visible: true });
      globalObj.functions.setProperty(globalObj.form.resultPanel.errorResultPanel, { visible: true });
      invokeJourneyDropOffUpdate('FINAL_DAP_FAILURE', mobileNumber, leadProfileId, journeyId, globalObj);
      console.log(response);
    },
  };
  // const res = {};
  // updatePanelVisibility(res, globals);

  restAPICall(globals, 'POST', payload, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallback);
};
export { finalDap, updatePanelVisibility };
