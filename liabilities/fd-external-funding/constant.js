
  // declare CONSTANTS for External Funding FD only.
  const FORM_NAME = 'External Funding FD';
  const CHANNEL = 'WEB';
  const JOURNEY_NAME = 'EXTERNAL_FUNDING_FD';
  const VISIT_MODE = 'U';
  const NTB_REDIRECTION_URL = 'https://smartx.hdfcbank.com/?journey=NTBFD&channel=RBB'
  const DOM_ELEMENT = {
    identifyYourself: {
      chekbox1Label: 'checkboxConsent1Label',
      chekbox2Label: 'checkboxConsent2Label',
      consent1Content: 'consentPanel1',
      consent2Content: 'consentPanel2',
      modalBtnWrapper: 'button-wrapper',
      checkbox1ProductLabel: '.field-checkboxconsent1label',
      checkbox2ProductLabel: '.field-checkboxconsent2label',
      anchorTagClass: 'link',
    },
  };

  const EFFD_ENDPOINTS = {
    customerOtpGen: '/content/hdfc_customerinfo/api/customerIdentificationOTPGen.json',
    otpValidationFetchCasa: '/content/hdfc_customerinfo/api/otpValidationOrchestration.json',
  };

  export {
    CHANNEL,
    JOURNEY_NAME,
    VISIT_MODE,
    DOM_ELEMENT,
    FORM_NAME,
    EFFD_ENDPOINTS,
    NTB_REDIRECTION_URL,
  };
  