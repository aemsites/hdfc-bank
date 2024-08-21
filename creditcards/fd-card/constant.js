// declare CONSTANTS for (fd) fd only.

const JOURNEY_NAME = 'EXISTING_CC_BASED_FDLIEN_JOURNEY';

const AGE_LIMIT = {
  min: 18,
  max: 80,
};

// const REGEX_PAN = /^[a-zA-Z]{3}[Pp][a-zA-Z][0-9]{4}[a-zA-Z]{1}/g;
const REGEX_PAN = /^[A-Za-z]{5}\d{4}[A-Za-z]$/g; // matches Pan regex without considering the 'p' char in P

const ERROR_MSG = {
  panLabel: 'PAN',
  dobLabel: 'DOB',
  panError: 'Please enter a valid PAN Number',
  mobileError: 'Enter valid mobile number',
  ageLimit: `Age should be between ${AGE_LIMIT.min} to ${AGE_LIMIT.max}`,
};

const FD_ENDPOINTS = {
  otpGen: '/content/hdfc_hafcards/api/customeridentificationotpgen.json',
  otpVal: '/content/hdfc_hafcards/api/otpvalidationandcardsinquiry.json',
  journeyDropOff: '/content/hdfc_commonforms/api/journeydropoff.json',
  customeraccountdetailsdto: '/content/hdfc_hafcards/api/hdfccardscustomeraccountdetailsdto.json',
};

const OTP_TIMER = 30;
const MODE = 'dev';
// const MODE = 'prod';
const FORM_NAME = 'FD lien card';
const MAX_OTP_RESEND_COUNT = 3;
const MAXIMUM_CREDIT_AMOUNT = 800000;
const NAME_ON_CARD_LENGTH = 19;

export {
  JOURNEY_NAME,
  ERROR_MSG,
  AGE_LIMIT,
  REGEX_PAN,
  OTP_TIMER,
  FD_ENDPOINTS,
  MAX_OTP_RESEND_COUNT,
  MODE,
  MAXIMUM_CREDIT_AMOUNT,
  NAME_ON_CARD_LENGTH,
  FORM_NAME,
};
