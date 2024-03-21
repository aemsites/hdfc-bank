/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import createJourneyId from '../common/journey-utils.js';
import {
  formUtil, maskNumber, urlPath, clearString, getTimeStamp, convertDateToMmmDdYyyy,
} from '../common/formutils.js';

const journeyName = 'CORPORATE_CREDIT_CARD';
const currentFormContext = {
  journeyID: createJourneyId('a', 'b', 'c'),
  journeyName,
};

/**
 * Appends a masked number to the specified container element.
 * @param {String} containerClass - The class name of the container element.
 * @param {String} number - The number to be masked and appended to the container element.
 * @returns {void}
 */
const appendMaskedNumber = (containerClass, number) => {
  const otpHelpText = document.getElementsByClassName(containerClass)?.[0];
  const pElement = otpHelpText?.querySelector('p');
  const nestedPElement = pElement?.querySelector('p');
  const newText = document.createTextNode(`${maskNumber(number, 6)}.`);
  nestedPElement?.appendChild(newText);
};

/**
 * Handles the success scenario for OTP generation.
 * @param {any} res  - The response object containing the OTP success generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpGenSuccess = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.welcomeTextLabel,
    login: globals.form.loginPanel,
    otp: globals.form.otpPanel,
    otpButton: globals.form.getOTPbutton,
    currentAddressNTB: globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressNTB,
    currentAddressETB: globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressETB,
    panWizardField: globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.dobPersonalDetails,
    dobWizardField: globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails.panNumberPersonalDetails,
  };
  currentFormContext.isCustomerIdentified = res?.customerIdentificationResponse?.CustomerIdentificationResponse?.errorCode === '0' ? 'Y' : 'N';
  const welcomeTxt = formUtil(globals, pannel.welcome);
  const otpPanel = formUtil(globals, pannel.otp);
  const otpBtn = formUtil(globals, pannel.otpButton);
  const loginPanel = formUtil(globals, pannel.login);
  const regMobNo = pannel.login.mobilePanel.registeredMobileNumber.$value;

  const panWizardField = formUtil(globals, pannel.panWizardField);
  const dobWizardField = formUtil(globals, pannel.dobWizardField);
  const currentAddressNTB = formUtil(globals, pannel.currentAddressNTB);
  const currentAddressETB = formUtil(globals, pannel.currentAddressETB);

  welcomeTxt.visible(false);
  otpBtn.visible(false);
  loginPanel.visible(false);
  otpPanel.visible(true);

  appendMaskedNumber('field-otphelptext', regMobNo);
};

/**
 * Handles the failure scenario for OTP generation.
 * @param {any} res  - The response object containing the OTP failure generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpGenFailure = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.welcomeTextLabel,
    login: globals.form.loginPanel,
    otp: globals.form.otpPanel,
    otpButton: globals.form.getOTPbutton,
    resultPanel: globals.form.resultPanel,
  };

  const welcomeTxt = formUtil(globals, pannel.welcome);
  const otpPanel = formUtil(globals, pannel.otp);
  const loginPanel = formUtil(globals, pannel.login);
  const otpBtn = formUtil(globals, pannel.otpButton);
  const regMobNo = pannel.login.mobilePanel.registeredMobileNumber.$value;
  const failurePanel = formUtil(globals, pannel.resultPanel);

  welcomeTxt.visible(false);
  otpPanel.visible(false);
  loginPanel.visible(false);
  otpBtn.visible(false);
  failurePanel.visible(true);

  appendMaskedNumber('field-otphelptext', regMobNo);
};

const OTPGEN = {
  getPayload(globals) {
    const mobileNo = globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value;
    const panNo = globals.form.loginPanel.identifierPanel.pan.$value;
    const dob = clearString(globals.form.loginPanel.identifierPanel.dateOfBirth.$value);
    const jsonObj = {};
    jsonObj.requestString = {};
    jsonObj.requestString.mobileNumber = String(mobileNo) ?? '';
    jsonObj.requestString.dateOfBith = dob ?? '';
    jsonObj.requestString.panNumber = panNo ?? '';
    jsonObj.requestString.journeyID = currentFormContext.journeyID;
    jsonObj.requestString.journeyName = currentFormContext.journeyName;
    jsonObj.requestString.userAgent = window.navigator.userAgent;
    jsonObj.requestString.identifierValue = panNo || dob;
    jsonObj.requestString.identifierName = panNo ? 'PAN' : 'DOB';
    return jsonObj;
  },
  successCallback(res, globals) {
    return (res?.otpGenResponse?.status?.errorCode === '0') ? otpGenSuccess(res, globals) : otpGenFailure(res, globals);
  },
  errorCallback(err, globals) {
    otpGenFailure(err, globals);
    console.log(`I am in errorCallback OTP GEN ${globals}`);
  },
  path: urlPath('/content/hdfc_ccforms/api/customeridentificationV4.json'),
  loadingText: 'Please wait while we are authenticating you',
};

/**
 * Automatically fills form fields based on response data.
 * @param {object} res - The response data object.
 * @param {object} globals - Global variables object.
 * @param {object} panel - Panel object.
 */
const formFieldAutoFill = (res, globals, panel) => {
  // Extract personal details from globals
  const personalDetails = globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.personalDetails;

  // Extract breCheckAndFetchDemogResponse from res
  const breCheckAndFetchDemogResponse = res.otpValidationResponse?.demogResponse?.BRECheckAndFetchDemogResponse;

  if (!breCheckAndFetchDemogResponse) return;

  // Extract gender from response
  const custGender = breCheckAndFetchDemogResponse?.VDCUSTGENDER;
  const genderMap = {
    M: 'Male',
    F: 'Female',
  };

  const gender = genderMap[custGender] || 'Others';
  globals.functions.setProperty(personalDetails.gender, { value: gender });

  // Extract name from response
  const { VDCUSTFULLNAME: FullName } = breCheckAndFetchDemogResponse || {};
  const [firstName, ...remainingName] = FullName.split(' ');
  const lastName = remainingName.pop() || '';
  const middleName = remainingName.join(' ');
  globals.functions.setProperty(personalDetails.firstName, { value: firstName });
  globals.functions.setProperty(personalDetails.lastName, { value: lastName });
  globals.functions.setProperty(personalDetails.middleName, { value: middleName });

  // Extract date of birth or ITNBR
  const custDate = panel.login.pan.$value ? breCheckAndFetchDemogResponse?.DDCUSTDATEOFBIRTH : breCheckAndFetchDemogResponse?.VDCUSTITNBR;
  globals.functions.setProperty(personalDetails.dobPersonalDetails, { value: panel.login.pan.$value ? convertDateToMmmDdYyyy(custDate.toString()) : custDate });

  // Create address string and set it to form field
  const completeAddress = [
    breCheckAndFetchDemogResponse?.VDCUSTADD1,
    breCheckAndFetchDemogResponse?.VDCUSTADD2,
    breCheckAndFetchDemogResponse?.VDCUSTADD3,
    breCheckAndFetchDemogResponse?.VDCUSTCITY,
    breCheckAndFetchDemogResponse?.VDCUSTSTATE,
    breCheckAndFetchDemogResponse?.VDCUSTZIPCODE,
  ].filter(Boolean).join(', ');

  globals.functions.setProperty(globals.form.corporateCardWizardView.yourDetailsPanel.yourDetailsPage.currentDetails.currentAddressETB.prefilledCurrentAdddress, { value: completeAddress });
};

/**
 * Handles the success scenario for OTP Validation.
 * @param {any} res  - The response object containing the OTP success generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpValSuccess = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.welcomeTextLabel,
    login: globals.form.loginPanel,
    otp: globals.form.otpPanel,
    otpButton: globals.form.getOTPbutton,
    ccWizardView: globals.form.corporateCardWizardView,
    resultPanel: globals.form.resultPanel,
  };
  currentFormContext.isCustomerIdentified = res?.customerIdentificationResponse?.CustomerIdentificationResponse?.errorCode === '0' ? 'Y' : 'N';
  const welcomeTxt = formUtil(globals, pannel.welcome);
  const otpPanel = formUtil(globals, pannel.otp);
  const otpBtn = formUtil(globals, pannel.otpButton);
  const loginPanel = formUtil(globals, pannel.login);
  const ccWizardPannel = formUtil(globals, pannel.ccWizardView);

  welcomeTxt.visible(false);
  otpBtn.visible(false);
  loginPanel.visible(false);
  otpPanel.visible(false);
  ccWizardPannel.visible(true);
  if (currentFormContext.existingCustomer === 'Y') {
    formFieldAutoFill(res, globals, pannel);
  }
  (async () => {
    const myImportedModule = await import('./cc.js');
    myImportedModule.onWizardInit();
  })();
};

/**
 * Handles the failure scenario for OTP Validation.
 * @param {any} res  - The response object containing the OTP success generation response.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const otpValFailure = (res, globals) => {
  const pannel = {
    // declare parent panel -- common name defining
    welcome: globals.form.welcomeTextLabel,
    login: globals.form.loginPanel,
    otp: globals.form.otpPanel,
    otpButton: globals.form.getOTPbutton,
    ccWizardView: globals.form.corporateCardWizardView,
    resultPanel: globals.form.resultPanel,
  };
  currentFormContext.isCustomerIdentified = res?.customerIdentificationResponse?.CustomerIdentificationResponse?.errorCode === '0' ? 'Y' : 'N';
  const welcomeTxt = formUtil(globals, pannel.welcome);
  const otpPanel = formUtil(globals, pannel.otp);
  const otpBtn = formUtil(globals, pannel.otpButton);
  const loginPanel = formUtil(globals, pannel.login);
  const ccWizardPannel = formUtil(globals, pannel.ccWizardView);
  // const resultPanel = formUtil(globals, pannel.resultPanel);

  welcomeTxt.visible(false);
  otpBtn.visible(false);
  loginPanel.visible(false);
  otpPanel.visible(false);
  ccWizardPannel.visible(true);

  // Created mock flag for testing
  const mockFlag = true;
  if (mockFlag || currentFormContext.existingCustomer === 'Y') {
    // Created mock result for development
    const result = {
      otpValidationResponse: {
        errorMessage: '',
        errorCode: '00',
        demogResponse: {
          errorMessage: '0',
          errorCode: '0',
          BRECheckAndFetchDemogResponse: {
            VDCUSTZIPCODE: 400001,
            DECISION: null,
            VDCUSTEMAILADD: null,
            DDCUSTDATEOFBIRTH: 19920910,
            FWCUSTID: 0,
            VDCUSTGENDER: 'M',
            BREFILLER1: null,
            VDCUSTADD2: 'Halsiyo Ki Dhani, Mumbai 234-B',
            BREFILLER2: 'D101',
            VDCUSTADD3: 'Bandup, erondi opiuy jklo  ino',
            BREFILLER3: 'AD0292400010',
            SOURCEID: 'FINWARE',
            BREFILLER4: 'SUCCESSFUL RESPONSE',
            VDCUSTADD1: 'KANJUR _F qwerrt poiiui asdfg',
            VDCUSTFIRSTNAME: 'VIPUL KABRA',
            VDCUSTNAMESHORT: null,
            PRODUCTCODE: null,
            VDCUSTMIDDLENAME: null,
            STP: null,
            VDCUSTADD4: null,
            BREFILLER9: null,
            CUSTOMERID: 0,
            VDCUSTFULLNAME: 'Vipul Kabra',
            BREFILLER5: null,
            IPA0: 'Y',
            BREFILLER6: null,
            BREFILLER7: null,
            BREFILLER8: null,
            VDCUSTLASTNAME: null,
            VDCUSTTYPE: 'F',
            ACCOUNTID: 'XXXXXXXXXX6180',
            VDCUSTITNBR: 'EGYPZ5203D',
            OLDAAN: null,
            ELIGLIMIT: null,
            BREFILLER12: null,
            BREFILLER11: null,
            BREFILLER10: null,
            SEGMENT: 'ONLY_CASA',
            VDCUSTSTATE: 'Rajasthan',
            PRICINGCODE: null,
            TOKENSTRING: 'ONLY_CASA||Y',
            PROMOCODE: null,
            VDCUSTCITY: 'Mumbai',
            DECISIONCODE: null,
            FWACCNTNUM: 'XXXXXXXXXX6180',
            MOBILE: 9819842418,
          },
          Id_token_jwt: 'cTibXoo7gMgv04Ra-uWriHhvXJvC4JhXW6VDUymq_fWegg-Wsh5WqBllsYcp-GyKDQqXFC2cahP4At14W80USbHdwBIe0IAjZ7fUKyYBFE597lrSP7uorgnqbW_V3b0dnBwMLDkZaVJryPKTHgLFF5EDEQ__4vS1bK6TtpcgipnwkrF8hXSasPj27MbUTlPun08f-kLiLOraYnngcj0UTJIWE1tn7ugEo-fw2Exb3NgQ3SAqLRNHH79auCMN9xGuQTYMvUQNKY0VxffEB186t1nk9vinIqXVldP38GmEE1vDrnJ0Cw19PERmWDdaFomJs3hyEo-rbTZRjjg_weLcyg.JBnNMyZWTYubzZC5PyKAfg.9iyFigW3IKptm8e2cloIssHcLI_ifOnYt1oIGpYnO9XALwHuumvpVcZ1pRHDL7o9UUDmdfhpI13b_mVufmbm0ErtaGEskqf9aWmT699gQhlv2Nbx-6qWs1d-suYHELLYD-0GEI_xh-Iz4NBW82z7kej8GoHt-aWC8qIkX2q4YB-3bSFY-WL98E0IAiWGZf-4CglXOhCFnElgs-sgz05DtF11r3K2ElF_gkjdBR-IwiswJgBL7EOwruowNNCX6uTzupl8hHb6iMg5SX3_f2d1U8YsFds8vcwPpZuWylJkILS5pklUq6jPeZUqsxDjjlwPoiodMmyLQtBDBzZ6KEKHuV7rxahxbgIw2XbAnUFtSZ-qJR3XE7OqjK4B1hGES8d7l5S39l6DLCw3yclPIze3oWfl0dcbZDAtfyqoS3Vm7D8leiByOuTBJm2gE3FXVkUxcWWzG-ac73O5T5RkdvVoqGMkd8-6zwuNM1Y8t7sZooODER_MT8rtKIUDbI2mct3GTC-BpzvdX8vPrYQaBeA8scQL5mBG_LfmIDJrE0BJF26fRYoNjT9Xtzk08-FeD_2i2BcWxDVUYsOkVWGfWX9iCGNVEww9rgq2L2kOCTp3-dWyjqYCdoSMv1cM_RqKilDvwcRgzKHkTJuTOvyI1Ham-93rbBCVvn2UCbLPxqOrZWAAV3-sBmo2wRgM6Zx4CjhwuyC2xQT1KedNJh-ImrjysenXpW5Ur7R-mohQrxjjORQIe2Pm8tgzKMsY9izeT_V2aJZRQxaGAD5-5xxZaQYWAqvcTK5eFwY3rh519qU0X_AbLn7L059cb8pCY3Osfpw2E4g3zyq8v0DvaI2ZkV9EUWG5P331SFJxIw9cgnLlv7VYzvpIGjf7iSMzUKON-B-T4ND9bdFkQiSHJ8u3tlvGMC96XkCzUMgrJNDMJl-5UgeBKUUKCx2Nk5VGGfzoS_rPPNMI3hn3fPerEHO2iopFkPgI-mApQ5MmGKf5Dzmy8UE.Nj90tcWFn-12O_xbTHx_Tg',
        },
      },
    };

    // For development passing mock data "result". Need to pass "res" in real case
    formFieldAutoFill(result, globals, pannel);
  }
  (async () => {
    const myImportedModule = await import('./cc.js');
    myImportedModule.onWizardInit();
  })();
  // resultPanel.visible(true);
};

const OTPVAL = {
  getPayload(globals) {
    const mobileNo = globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value;
    const panNo = globals.form.loginPanel.identifierPanel.pan.$value;
    const passwordValue = globals.form.otpPanel.otpNumber.$value;
    const dob = clearString(globals.form.loginPanel.identifierPanel.dateOfBirth.$value);
    const jsonObj = {};
    jsonObj.requestString = {};
    jsonObj.requestString.mobileNumber = String(mobileNo) ?? '';
    jsonObj.requestString.panNumber = String(panNo) ?? '';
    jsonObj.requestString.dateOfBirth = String(dob) ?? '';
    jsonObj.requestString.channelSource = '';
    jsonObj.requestString.dedupeFlag = 'N';
    jsonObj.requestString.passwordValue = passwordValue ?? '';
    jsonObj.requestString.referenceNumber = `AD${getTimeStamp(new Date())}` ?? '';
    jsonObj.requestString.journeyID = currentFormContext.journeyID;
    jsonObj.requestString.journeyName = currentFormContext.journeyName;
    jsonObj.requestString.userAgent = window.navigator.userAgent;
    jsonObj.requestString.existingCustomer = currentFormContext.isCustomerIdentified ?? '';
    return jsonObj;
  },
  successCallback(res, globals) {
    return (res?.otpGenResponse?.status?.errorCode === '0') ? otpValSuccess(res, globals) : otpValFailure(res, globals);
  },
  errorCallback(err, globals) {
    otpValFailure(err, globals);
    console.log(`I am in errorCallback_OtpFailure ${globals}`);
  },
  path: urlPath('/content/hdfc_cc_unified/api/otpValFetchAssetDemog.json'),
  loadingText: 'Please wait while we are authenticating you',
};
export { OTPGEN, OTPVAL };
