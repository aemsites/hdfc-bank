const JOURNEY_NAME = 'SMART_EMI_JOURNEY';
const PRO_CODE = '009';
const CHANNEL = 'ADOBE_WEB';
const ERROR_MSG = {
  mobileError: 'Enter valid mobile number',
};

const SEMI_ENDPOINTS = {
  otpGen: 'https://applyonlinedev.hdfcbank.com/content/hdfc_ccforms/api/validatecardotpgen.json',
  otpVal: 'https://applyonlinedev.hdfcbank.com/content/hdfc_ccforms/api/eligibilitycheck.json',
};

const DOM_ELEMENT = {
  semiWizard: 'aem_semiWizard',
  chooseTransaction: 'aem_chooseTransactions',
  selectTenure: 'aem_selectTenure',
};

const MISC = {
  rupeesUnicode: '\u20B9',
};

const OTP_TIMER = 30;
const MAX_OTP_RESEND_COUNT = 3;
const CURRENT_FORM_CONTEXT = {};

export {
  JOURNEY_NAME,
  ERROR_MSG,
  OTP_TIMER,
  SEMI_ENDPOINTS,
  MAX_OTP_RESEND_COUNT,
  CURRENT_FORM_CONTEXT,
  CHANNEL,
  PRO_CODE,
  DOM_ELEMENT,
  MISC,
};