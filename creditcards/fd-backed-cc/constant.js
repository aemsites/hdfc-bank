// declare CONSTANTS for (fd) fd only.

const JOURNEY_NAME = 'EXISTING_CC_BASED_FDLIEN_JOURNEY';

const AGE_LIMIT = {
  min: 18,
  max: 80,
};

const REGEX_PAN = /^[A-Za-z]{5}\d{4}[A-Za-z]$/g; // matches Pan regex without considering the 'p' char in P

const ERROR_MSG = {
  panLabel: 'PAN',
  dobLabel: 'DOB',
  panError: 'Please enter a valid PAN Number',
  mobileError: 'Enter valid mobile number',
  ageLimit: `Age should be between ${AGE_LIMIT.min} to ${AGE_LIMIT.max}`,
  invalidPan: 'Maximum PAN retry attempts exceeded.',
  matchingAddressLine: 'Address Line 1 and Address Line 2 cannot be same',
  invalidAddress: 'Please enter a valid address, allowed special characters(.,/-)',
  tooShortAddress: 'Address is too short(minimum 10 characters)',
  tooLongAddress: 'Address is too long(maximum 30 characters)',
  shortAddressNote: 'Note: Address is too short, please enter valid address.',
  invalidPinNote: 'Note: Pincode is not matching with the city in address as per the bank records, please provide correct address.',
  sessionExpired: 'Session expired',
  idcomCancelledByUser: 'Sorry Authentication Failed! You can retry with Debit Card / Net Banking authentication.',
  sessionExpiredDescription: 'Oops! your session expired due to inactivity. Please do not refresh the page and try again.',
  branchVisitWithRefNum: 'Visit your nearest dealership or HDFC Bank branch with reference number:',
  aadhaarMaxOtpAttemptsTitle: 'OTP Attempt Limit Reached',
  aadhaarMaxOtpAttempts: 'You have exceeded the maximum number of OTP attempts.',
  aadhaarMaxOtpAttemptsStatusCode: '35',
  aadhaarTimeoutTitle: 'Aadhaar eKYC Unavailable Due to Technical Issues',
  aadhaarTimeout: 'Sorry, we are unable to proceed with Aadhaar EKYC due to technical issues.',
  requestNotProcessed: 'Your request could not be processed, please try again to continue.',
  pleaseRetry: 'Please retry.',
  forceApplicationSubmit: 'You have exhausted all attempts(3) to verify your details. Our bank representative will reach out to you shortly for completing the application.',
};

const FD_ENDPOINTS = {
  otpGen: '/content/hdfc_hafcards/api/customeridentificationotpgen.json',
  otpVal: '/content/hdfc_hafcards/api/otpvalidationandcardsinquiry.json',
  journeyDropOff: '/content/hdfc_commonforms/api/journeydropoff.json',
  emailId: '/content/hdfc_commonforms/api/emailid.json',
};

const OTP_TIMER = 30;
const MODE = 'dev';
const MAX_OTP_RESEND_COUNT = 3;

const DOM_ELEMENT = {
  selectKyc: {
    aadharModalContent: 'aadharConsentPopup',
    modalBtnWrapper: 'button-wrapper',
    defaultLanguage: 'English',
  },
  identifyYourself: {
    dob: 'dateOfBirth',
    anchorTagClass: 'link',
    checkbox1ProductLabel: '.field-checkboxconsent1label',
    checkbox2ProductLabel: '.field-checkboxconsent2label',
    chekbox1Label: 'checkboxConsent1Label',
    chekbox2Label: 'checkboxConsent2Label',
    consent1Content: 'consentPanel1',
    consent2Content: 'consentPanel2',
    modalBtnWrapper: 'button-wrapper',
  },
  personalDetails: {
    dob: 'dateOfBirthPersonalDetails',
  },
};

const GENDER_MAP = {
  Male: '1', Female: '2', Others: '3', 'Third Gender': '3',
};

const ALLOWED_CHARACTERS = '/ -,';

const FD_JOURNEY_STATE = {
  resumeJourneyDataPrefilled: 'RESUME_JOURNEY_DATA_PREFILLED',
};

export {
  JOURNEY_NAME,
  ERROR_MSG,
  AGE_LIMIT,
  REGEX_PAN,
  OTP_TIMER,
  FD_ENDPOINTS,
  MAX_OTP_RESEND_COUNT,
  MODE,
  DOM_ELEMENT,
  GENDER_MAP,
  ALLOWED_CHARACTERS,
  FD_JOURNEY_STATE,
};
