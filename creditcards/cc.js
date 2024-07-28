/* eslint-disable no-tabs */
/* eslint no-console: ["error", { allow: ["warn", "error", "debug"] }] */
import {
  HelpIconModal,
} from '../blocks/icon-modal/icon-modal.js';
import openModal from '../blocks/modal/modal.js';
import { sendPageloadEvent, sendAnalytics } from '../common/analytics.js';
import { invokeJourneyDropOffUpdate } from '../common/journey-utils.js';

const createLabelInElement = (elementSelector, labelClass) => {
  /**
	 * The main element in the DOM where the form resides.
	 * @type {HTMLElement}
	 */
  const mainEl = document.getElementsByTagName('main')[0];
  /**
	 * The form element containing the target element.
	 * @type {HTMLElement}
	 */
  const formEl = mainEl.querySelector('form');
  /**
	 * The target element to which the label will be appended.
	 * @type {HTMLElement}
	 */
  const element = formEl.querySelector(elementSelector);
  if (!element) {
    console.debug(`Element with selector '${elementSelector}' not found.`);
    return;
  }
  /**
	 * The text content of the label element.
	 * @type {string}
	 */
  const labelText = element.getElementsByTagName('label')[0].innerHTML;
  element.getElementsByTagName('label')[0].innerHTML = '';
  if (!labelText) {
    console.error(`No data-label attribute found for element with selector '${elementSelector}'.`);
    return;
  }

  /**
	 * The newly created label element.
	 * @type {HTMLLabelElement}
	 */
  const labelElement = document.createElement('label');
  labelElement.classList.add(labelClass);
  labelElement.textContent = labelText;
  element.appendChild(labelElement);
};
/**
 * Decorates the stepper for CC yourDetails panel
 * @name decorateStepper Runs after yourDetails panel is initialized
 */
function decorateStepper() {
  const totalIndex = document.querySelector('.field-corporatecardwizardview.wizard').style.getPropertyValue('--wizard-step-count');
  const ccDetailsWizard = document.querySelector('.field-corporatecardwizardview.wizard ul');
  Array.from(ccDetailsWizard.children).forEach((child) => {
    if (child.tagName.toLowerCase() === 'li' && Number(child.getAttribute('data-index')) !== totalIndex - 1) {
      child?.classList?.add('stepper-style');
    }
  });
}

/**
 * On Wizard Init.
 * @name onWizardInit Runs on initialization of wizard
 */
function onWizardInit() {
  createLabelInElement('.field-permanentaddresstoggle', 'permanent-address-toggle__label');
  createLabelInElement('.field-currentaddresstoggle', 'current-address-toggle__label');
  createLabelInElement('.field-ckyctoggle', 'ckyctoggle__label');
  decorateStepper();
}

/* startCode for creating Modal */
/**
 * Function to link a trigger element with a modal opening functionality.
 * @param {Object} config - Configuration object for the modal.
 * @param {HTMLElement} config.triggerElement - The element triggering the modal.
 * @param {HTMLElement} config.content - The content to display in the modal.
 * @param {String} [config.actionWrapClass] - Wrapper class containing all the buttons.
 * @param {Boolean} [config.reqConsentAgree=false] - Flag indicating whether consent agreement is required.
 * @param {Function} [config.updateUI] - Function for DOM manipulation upon receiving data.
 */

const linkModalFunction = (config) => {
  config?.triggerElement?.addEventListener('click', async (e) => {
    const { checked, type } = e.target;
    const checkBoxElement = (type === 'checkbox') && checked;
    const otherElement = true;
    const elementType = (type === 'checkbox') ? checkBoxElement : otherElement;
    if (elementType) {
      e.preventDefault();
      await openModal(config);
      config?.content?.addEventListener('modalTriggerValue', (event) => {
        const receivedData = event.detail;
        if (config?.updateUI) {
          config?.updateUI(receivedData);
        }
      });
    }
  });
};
/* endCode for creating Modal */

/* modalLinking  in pages  */
// 1.consent-2 checkbox - modal
const consent2Config = {
  // config to create modal for consent-2
  triggerElement: document.getElementsByName('checkboxConsent2Label')?.[0], // trigger element for calling modalFunction
  content: document.getElementsByName('consentPanel2')?.[0], // content to display in modal
  actionWrapClass: 'button-wrapper', // wrapper class containing all the buttons
  reqConsentAgree: false, // Indicates if consent agreement is needed; shows close icon if not.
  /**
	 * Updates the UI based on received data.
	 * @param {Object} receivedData - Data received after the modal button trigger,contains name of the btn triggered which is used to update the UI.
	 */
  updateUI(receivedData) {
    if (receivedData?.checkboxConsent2CTA) {
      // iAgreeConsent2- name of the I agree btn.
      this.triggerElement.checked = true;
      this.triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (receivedData?.closeIcon) {
      // closeIcon - name of the Close x btn
      this.triggerElement.checked = false;
      this.triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
};
linkModalFunction(consent2Config);
// 2.consent-2 otherProduct-text - modal
const consent2OtherProduct = document?.querySelector('.field-checkboxconsent2label')?.querySelector('b');
const linkClass = 'link';
consent2OtherProduct?.classList.add(linkClass);
const consent2OtherProductTxtConfig = {
  // config to create modal for consent-2
  triggerElement: consent2OtherProduct, // trigger element for calling modalFunction
  content: consent2Config?.content, // content to display in modal
  actionWrapClass: 'button-wrapper', // wrapper class containing all the buttons
  reqConsentAgree: false, // Indicates if consent agreement is needed; shows close icon if not.
  /**
	 * Updates the UI based on received data.
	 * @param {Object} receivedData - Data received after the modal button trigger,contains name of the btn triggered which is used to update the UI.
	 */
  updateUI(receivedData) {
    const checkBox = consent2Config?.triggerElement;
    if (receivedData?.checkboxConsent2CTA) {
      // iAgreeConsent2- name of the I agree btn.
      checkBox.checked = true;
    }
    if (receivedData?.closeIcon) {
      // closeIcon - name of the Close x btn
      checkBox.checked = false;
    }
  },
};
linkModalFunction(consent2OtherProductTxtConfig);

// 3.conset-1 checbox - modal
const consent1Config = {
  // config to create modal for consent-1
  triggerElement: document.getElementsByName('checkboxConsent1Label')?.[0], // trigger element for calling modalFunction
  content: document.getElementsByName('consentPanel1')?.[0], // content to display in modal
  actionWrapClass: 'button-wrapper', // wrapper class containing all the buttons
  reqConsentAgree: true, // Indicates if consent agreement is needed; shows close icon if not.
  /**
	 * Updates the UI based on received data.
	 * @param {Object} receivedData - Data received after the modal button trigger,contains name of the btn triggered which is used to update the UI.
	 */
  updateUI(receivedData) {
    if (receivedData?.checkboxConsent1CTA) {
      // iAgreeConsent2- name of the I agree btn.
      this.triggerElement.checked = true;
      this.triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (receivedData?.closeIcon) {
      // closeIcon - name of the Close x btn
      this.triggerElement.checked = false;
      this.triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
};
linkModalFunction(consent1Config);

// 4.consent-1 requestProduct-text - modal
const consent1RequestProduct = document?.querySelector('.field-checkboxconsent1label')?.querySelector('b');
consent1RequestProduct?.classList.add(linkClass);
const consent2RequestProductTxtConfig = {
  // config to create modal for consent-2
  triggerElement: consent1RequestProduct, // trigger element for calling modalFunction
  content: consent1Config?.content, // content to display in modal
  actionWrapClass: 'button-wrapper', // wrapper class containing all the buttons
  reqConsentAgree: true, // Indicates if consent agreement is needed; shows close icon if not.
  /**
	 * Updates the UI based on received data.
	 * @param {Object} receivedData - Data received after the modal button trigger,contains name of the btn triggered which is used to update the UI.
	 */
  updateUI(receivedData) {
    const checkBox = consent1Config?.triggerElement;
    if (receivedData?.checkboxConsent1CTA) {
      // iAgreeConsent2- name of the I agree btn.
      checkBox.checked = true;
    }
    if (receivedData?.closeIcon) {
      // closeIcon - name of the Close x btn
      checkBox.checked = false;
    }
  },
};
linkModalFunction(consent2RequestProductTxtConfig);

// 5.wizard screen getCard-viewAll button - modal
const viewAllBtnPannelConfig = {
  // linkModal for corporateCardWizard pannel view all in getThisCard screen.
  triggerElement: document.getElementsByName('viewAllCardBenefits')?.[0],
  content: document.getElementsByName('viewAllCardBenefitsPanel')?.[0],
  actionWrapClass: 'button-wrapper',
  reqConsentAgree: true,
};
linkModalFunction(viewAllBtnPannelConfig);

/* help icon modal- start */

const youtubeVideo = () => {
  /* hardcode (temporary) html for youtubePanel content👇 */
  const wrapper = document.createElement('div');
  // eslint-disable-next-line max-len
  wrapper.innerHTML = '<div class="youtube_player"><iframe id="YTplayer" class="iframe-container" frameborder="0" allowfullscreen="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" title="Get a Loan on Credit Card for your urgent money needs | HDFC Bank" width="640" height="360" src="https://www.youtube.com/embed/vpsiBSVeREE?modestbranding=1&amp;rel=0&amp;showinfo=0&amp;end=68000&amp;controls=0&amp;enablejsapi=1&amp;origin=https%3A%2F%2Fapplyonline.hdfcbank.com&amp;widgetid=1" style="height: 334.01px;"></iframe></div>';
  return wrapper;
};

/**
 * Finds the help icon and its associated text in the header container.
 * This function searches for elements within a container class that contains the word "help"
 * in their inner HTML content, and sets their cursor style to "pointer".
 *
 * @returns {Array<HTMLElement>} An array containing the help icon and the help text elements.
 * If no elements are found, returns an empty array.
 */
const findHelpIconInHeader = () => {
  const HEADER_HELP_KEY = 'help';
  const CONTAINER_CLASS = '.cmp-container';
  const [headerHelpIcon, headerHelpIconText] = Array.from(document.querySelector(CONTAINER_CLASS)?.children).filter((el) => el?.innerHTML?.trim()?.toLowerCase()?.includes(HEADER_HELP_KEY));
  [headerHelpIcon, headerHelpIconText].forEach((div) => {
    div.style.cursor = 'pointer'; // helpicon + helpText cursor style
  });
  return [headerHelpIcon, headerHelpIconText];
};

/**
 * Initializes and configures the Help Icon (in header) modal.
 *
 * This function sets up the help icon and its associated text as clickable elements
 * that trigger modals. It also configures and opens various modals, and handles
 * actions for closing the help subpanel modal.
 */
const launchHelpModal = () => {
  const [helpIcon, helpIconText] = findHelpIconInHeader(); // to find out the help icon & help text in header by using the class and keyword -help. 
  const helpIconConfig = new HelpIconModal(helpIcon, 'helpPopupContainer', 'button-wrapper', false, 'helppopupcontainer-dialog');
  const helpIconTextConfig = new HelpIconModal(helpIconText, 'helpPopupContainer', 'button-wrapper', false, 'helppopupcontainer-dialog');
  const helpSubPannel = new HelpIconModal('helpPanel1', 'helpPopupSubpanel', 'button-wrapper', false, 'helppoupsubpanel-dialog');
  const ytFramePanel = new HelpIconModal('helpPanel2', youtubeVideo(), null, false, 'ytpanel-dialog');
  [helpIconConfig, helpIconTextConfig, helpSubPannel, ytFramePanel].forEach((modalScript) => modalScript.showDialog());
  helpSubPannel.btnAction((receivedData) => {
    if (receivedData?.noStayHere) {
      helpSubPannel.closeDialog();
    }
    if (receivedData?.YesContinue) {
      helpSubPannel.closeDialog();
    }
  });
};
launchHelpModal();
/* help icon modal- end */

const displayLoader = (loadingText) => {
  const bodyContainer = document?.querySelector('.appear');
  bodyContainer?.classList?.add('preloader');
  if (loadingText) {
    bodyContainer.setAttribute('loader-text', loadingText);
  }
};

const hideLoaderGif = () => {
  const bodyContainer = document?.querySelector('.appear');
  bodyContainer?.classList?.remove('preloader');
  if (bodyContainer.hasAttribute('loader-text')) {
    bodyContainer.removeAttribute('loader-text');
  }
};

const errorPannelMethod = (error, stateInfoData) => {
  const errorPannel = document.getElementsByName('errorResultPanel')?.[0];
  const resultPanel = document.getElementsByName('resultPanel')?.[0];
  resultPanel.setAttribute('data-visible', true);
  errorPannel.setAttribute('data-visible', true);
  const mobileNumber = stateInfoData.form.login.registeredMobileNumber;
  const leadProfileId = stateInfoData.leadProifileId;
  const journeyId = stateInfoData.currentFormContext.journeyID;
  invokeJourneyDropOffUpdate('CUSTOMER_ONBOARDING_FAILURE', mobileNumber, leadProfileId, journeyId, stateInfoData);
};

const setArnNumberInResult = (arnNumRef) => {
  const nameOfArnRefPanel = 'arnRefNumPanel';
  const classNamefieldArnNo = '.field-newarnnumber';
  const arnRefNumPanel = document.querySelector(`[name= ${nameOfArnRefPanel}]`);
  const arnNumberElement = arnRefNumPanel.querySelector(classNamefieldArnNo);
  if (arnNumberElement) {
    // Manipulate the content of the <p> tag inside '.field-newarnnumber'
    arnNumberElement.querySelector('p').textContent = arnNumRef;
  }
};

const successPannelMethod = async (data, stateInfoData) => {
  const {
    executeInterfaceReqObj, aadharOtpValData, finalDapRequest, finalDapResponse,
  } = data;
  const journeyName = executeInterfaceReqObj?.requestString?.journeyFlag;
  const addressEditFlag = executeInterfaceReqObj?.requestString?.addressEditFlag;
  const { applicationNumber, vkycUrl } = finalDapResponse;
  const { currentFormContext } = (await import('../common/journey-utils.js')).corpCreditCardContext;
  currentFormContext.VKYC_URL = vkycUrl;
  // const { result: { mobileValid } } = aadharOtpValData;
  const mobileValid = aadharOtpValData?.result?.mobileValid;
  const resultPanel = document.getElementsByName('resultPanel')?.[0];
  const successPanel = document.getElementsByName('successResultPanel')?.[0];
  resultPanel.setAttribute('data-visible', true);
  successPanel.setAttribute('data-visible', true);
  setArnNumberInResult(applicationNumber);

  const vkycProceedButton = document.querySelector('.field-vkycproceedbutton ');
  const offerLink = document.querySelector('.field-offerslink');
  const vkycConfirmText = document.querySelector('.field-vkycconfirmationtext');
  // const filler4Val = finalDapRequest?.requestString?.VKYCConsent?.split(/[0-9]/g)?.[0];
  // const mobileMatch = !(filler4Val === 'NVKYC');
  const mobileMatch = !(mobileValid === 'n'); // (mobileValid === 'n') - unMatched - this should be the condition which has to be finalDap - need to verify.
  const kycStatus = (finalDapRequest.requestString.biometricStatus);
  const vkycCameraConfirmation = document.querySelector(`[name= ${'vkycCameraConfirmation'}]`);
  const vkycCameraPannelInstruction = document.querySelector('.field-cameraconfirmationpanelinstruction');

  if (journeyName === 'ETB') {
    if (addressEditFlag === 'N') {
      vkycProceedButton.setAttribute('data-visible', false);
      vkycConfirmText.setAttribute('data-visible', false);
      offerLink.setAttribute('data-visible', true);
    } else if (kycStatus === 'OVD') {
      vkycProceedButton.setAttribute('data-visible', false);
      vkycConfirmText.setAttribute('data-visible', true);
      offerLink.setAttribute('data-visible', false); // Adjusted assumption for offerLink
    } else if (mobileMatch && kycStatus === 'aadhaar' && addressEditFlag === 'Y') {
      vkycProceedButton.setAttribute('data-visible', false);
      vkycConfirmText.setAttribute('data-visible', false);
      offerLink.setAttribute('data-visible', true);
    } else {
      vkycProceedButton.setAttribute('data-visible', true);
      currentFormContext.isVideoKyc = true;
      vkycConfirmText.setAttribute('data-visible', true);
      offerLink.setAttribute('data-visible', false);
    }
  }
  if (journeyName === 'NTB' && (kycStatus === 'aadhaar')) {
    vkycCameraConfirmation.setAttribute('data-visible', true);
    vkycCameraPannelInstruction.setAttribute('data-visible', true);
    vkycProceedButton.setAttribute('data-visible', true);
    currentFormContext.isVideoKyc = true;
  }
  currentFormContext.action = 'confirmation';
  currentFormContext.pageGotRedirected = true;
  Promise.resolve(sendPageloadEvent('CONFIRMATION_JOURNEY_STATE', stateInfoData));
  const mobileNumber = stateInfoData.form.login.registeredMobileNumber;
  const leadProfileId = stateInfoData.leadProifileId;
  const journeyId = stateInfoData.currentFormContext.journeyID;
  invokeJourneyDropOffUpdate('CUSTOMER_ONBOARDING_COMPLETED', mobileNumber, leadProfileId, journeyId, stateInfoData);
};

// post-redirect-aadhar-or-idcom
const searchParam = new URLSearchParams(window.location.search);
const visitTypeParam = searchParam.get('visitType');
const authModeParam = searchParam.get('authmode');
const journeyId = searchParam.get('journeyId');
const aadharRedirect = visitTypeParam && (visitTypeParam === 'EKYC_AUTH');
const idComRedirect = authModeParam && ((authModeParam === 'DebitCard') || (authModeParam === 'CreditCard')); // debit card or credit card flow

/**
 * @name invokeJourneyDropOffByParam
 * @param {string} mobileNumber - mobileNumber-optional
 * @param {string} leadProfileId - leadProfileId-optional
 * @param {string} journeyID - JourneyId-required
 * @returns {object} - response-data
 */
const invokeJourneyDropOffByParam = async (mobileNumber, leadProfileId, journeyID) => {
  const journeyJSONObj = {
    RequestPayload: {
      leadProfile: {
      },
      journeyInfo: {
        journeyID,
      },
    },
  };
  const url = 'https://applyonlinedev.hdfcbank.com/content/hdfc_commonforms/api/journeydropoffparam.json';
  const method = 'POST';
  try {
    const res = await fetch(url, {
      method,
      body: JSON.stringify(journeyJSONObj),
      mode: 'cors',
      headers: {
        'Content-type': 'text/plain',
        Accept: 'application/json',
      },
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return error;
  }
};

/**
 * @name finalDap - constant-variables store
 */
const finalDap = {
  PROMOSE_COUNT: 0,
  AFFORD_COUNT: 10,
  journeyParamState: null,
  journeyParamStateInfo: null,
};

/**
 * @name finalDapFetchRes - recursive async action call maker untill it reaches the finaldap response.
 * @returns {void} error method or succes method based on the criteria of finalDapResponse reach or max limit reach.
 */
const finalDapFetchRes = async () => {
  const eventHandler = {
    successMethod: (data) => {
      const {
        currentFormContext: {
          executeInterfaceReqObj, finalDapRequest, finalDapResponse,
        }, aadhaar_otp_val_data: aadharOtpValData,
      } = JSON.parse(data.stateInfo);
      hideLoaderGif();
      successPannelMethod({
        executeInterfaceReqObj, aadharOtpValData, finalDapRequest, finalDapResponse,
      }, JSON.parse(data.stateInfo));
    },
    errorMethod: (err, lastStateData) => {
      hideLoaderGif();
      errorPannelMethod(err, lastStateData);
      // eslint-disable-next-line no-console
      console.log(err);
    },
  };
  try {
    const data = await invokeJourneyDropOffByParam('', '', journeyId);
    const journeyDropOffParamLast = data.formData.journeyStateInfo[data.formData.journeyStateInfo.length - 1];
    finalDap.journeyParamState = journeyDropOffParamLast.state;
    finalDap.journeyParamStateInfo = journeyDropOffParamLast.stateInfo;
    const checkFinalDapSuccess = (journeyDropOffParamLast.state === 'CUSTOMER_FINAL_DAP_SUCCESS');
    if (checkFinalDapSuccess) {
      return eventHandler.successMethod(journeyDropOffParamLast);
    }
    const err = 'Bad response';
    throw err;
  } catch (error) {
    // "FINAL_DAP_FAILURE"
    finalDap.PROMOSE_COUNT += 1;
    const errorCase = (finalDap.journeyParamState === 'CUSTOMER_FINAL_DAP_FAILURE' || finalDap.PROMOSE_COUNT >= finalDap.AFFORD_COUNT);
    const stateInfoData = finalDap.journeyParamStateInfo;
    if (errorCase) {
      return eventHandler.errorMethod(error, JSON.parse(stateInfoData));
    }
    return setTimeout(() => finalDapFetchRes(), 5000);
  }
};

//

/**
 * Redirects the user to different panels based on conditions.
 * If `aadhar` is true, navigates from 'corporateCardWizardView' to 'confirmAndSubmitPanel'
 * If `idCom` is true, initiates a journey drop-off process and handles the response which handles after all the final dap api call.
 * @param {boolean} aadhar - Indicates whether Aadhar redirection is triggered.
 * @param {boolean} idCom - Indicates whether ID com redirection is triggered.
 * @returns {void}
 */
const pageRedirected = (aadhar, idCom) => {
  if (aadhar) {
    const navigateFrom = document.getElementsByName('corporateCardWizardView')?.[0];
    const current = navigateFrom?.querySelector('.current-wizard-step');
    const currentMenuItem = navigateFrom?.querySelector('.wizard-menu-active-item');
    const navigateTo = document.getElementsByName('confirmAndSubmitPanel')?.[0];
    current?.classList?.remove('current-wizard-step');
    navigateTo?.classList?.add('current-wizard-step');
    // add/remove active class from menu item
    const navigateToMenuItem = navigateFrom?.querySelector(`li[data-index="${navigateTo?.dataset?.index}"]`);
    currentMenuItem?.classList?.remove('wizard-menu-active-item');
    navigateToMenuItem?.classList?.add('wizard-menu-active-item');
    const event = new CustomEvent('wizard:navigate', {
      detail: {
        prevStep: { id: current?.id, index: parseInt(current?.dataset?.index || 0, 10) },
        currStep: { id: navigateTo?.id, index: parseInt(navigateTo?.dataset?.index || 0, 10) },
      },
      bubbles: false,
    });
    navigateFrom?.dispatchEvent(event);
  }
  if (idCom) {
    /**
     * finaldapResponse starts for ETB - address change scenario.
     */
    setTimeout(() => {
      displayLoader();
      finalDapFetchRes();
    }, 2000);
  }
};
pageRedirected(aadharRedirect, idComRedirect);

/**
 * Changes the language of the Aadhar content to the specified language.
 * @param {Object} content - The content configuration for Aadhar.
 * @param {string} defaultLang - The language to show us default.
 */
// select dropdow-aadhar
const aadharLangChange = async (adharContentDom, defaultLang) => {
  const selectOp = adharContentDom.querySelector(`[name= ${'selectLanguage'}]`);
  const findFieldSet = adharContentDom?.querySelectorAll('fieldset');
  const selectedClass = 'selected-language';
  const defaultOptionClass = `field-aadharconsent-${defaultLang?.toLowerCase()}`;
  const applySelected = (fieldNode, optionClass, nameClass) => {
    fieldNode?.forEach((element) => {
      if (element?.classList?.contains(optionClass)) {
        element.style.display = 'block';
        element?.classList.add(nameClass);
      } else {
        element.style.display = 'none';
        element?.classList.remove(nameClass);
      }
    });
  };
  applySelected(findFieldSet, defaultOptionClass, selectedClass);
  const { currentFormContext } = (await import('../common/journey-utils.js')).corpCreditCardContext;
  currentFormContext.languageSelected = defaultLang;
  selectOp.value = defaultLang;
  selectOp?.addEventListener('change', (e) => {
    e.preventDefault();
    const { value: valueSelected } = e.target;
    selectOp.value = valueSelected;
    currentFormContext.languageSelected = valueSelected;
    const optionClass = `field-aadharconsent-${valueSelected?.toLowerCase()}`;
    applySelected(findFieldSet, optionClass, selectedClass);
  });
};

/**
 * Validates the date of birth field to ensure the age is between 18 and 70.
 * @param {string} inputName - The name of the calendar input field.
  */
const validateDob = (inputName) => {
  const calendarEl = document.querySelector(`[name= ${inputName}]`);
  const minAge = 18;
  const maxAge = 70;
  const calendarElParent = calendarEl?.parentElement;
  const dobDefFieldDesc = calendarElParent.querySelector('.field-description');
  const radioDob = document.getElementById('pandobselection');
  const dobErrorText = `Age should be between ${minAge} to ${maxAge}`;
  dobDefFieldDesc.style.display = 'none';
  calendarEl?.addEventListener('blur', async (e) => {
    const ipDobValue = e?.target?.value;
    if (ipDobValue) {
      const utils = await import('../common/formutils.js');
      const ageValid = utils.ageValidator(minAge, maxAge, ipDobValue);
      if (!ageValid) {
        utils.makeFieldInvalid(inputName, dobErrorText);
        dobDefFieldDesc.style.display = 'block';
      }
    }
  });
  calendarEl?.addEventListener('input', async () => {
    dobDefFieldDesc.style.display = 'none';
  });
  if (!(inputName === 'dateOfBirth')) return;
  radioDob?.addEventListener('click', () => {
    dobDefFieldDesc.style.display = 'none';
    calendarEl?.setAttribute('type', 'date');
    calendarEl?.setAttribute('edit-value', '');
    calendarEl?.setAttribute('display-value', '');
  });
};

/**
 * Validates a date field, disables future dates, and optionally validates age based on ageValidate flag.
 * @param {string} inputName - The name of the input field.
 * @param {boolean} ageValidate - Flag indicating whether to validate age (minAge:18, maxAge:70).
 */
const dateFieldValidate = (inputName, ageValidate) => {
  const calendarEl = document.querySelector(`[name= ${inputName}]`);
  calendarEl?.setAttribute('max', new Date()?.toISOString()?.split('T')?.[0]);
  if (ageValidate) {
    validateDob(inputName);
  }
};
dateFieldValidate('employedFrom');
dateFieldValidate('dateOfBirth', true);
dateFieldValidate('dobPersonalDetails', true);

/**
 * Validates and sanitizes input for personal names.
 * This function binds an 'input' event listener to the input field identified by the given name attribute.
 * It filters out non-numeric characters,spaces and special characters from the input value.
 *
 * @param {string} inputName - The name attribute value of the input field to be validated.
 * @returns {void}
 */
const validateNamesOfYourDetail = (inputName) => {
  const fName = document.querySelector(`[name= ${inputName}]`);
  fName.addEventListener('input', (e) => {
    const input = e.target;
    input.value = input.value.replace(/(?![A-Z])[`!@#$%^&*_\=\[\]{};':"\\|,.<>\/?~0-9()+-_ ]/g, ''); // Replace non-numeric characters with an empty string
  });
};

['firstName', 'middleName', 'lastName'].forEach((ipName) => validateNamesOfYourDetail(ipName));

const onPageLoadAnalytics = async () => {
  const { currentFormContext } = (await import('../common/journey-utils.js')).corpCreditCardContext;
  // eslint-disable-next-line no-underscore-dangle, no-undef
  currentFormContext.journeyId = myForm.resolveQualifiedName('$form.runtime.journeyId')._data.$_value;
  sendAnalytics('page load', {}, 'ACQUIRED', currentFormContext);
};

onPageLoadAnalytics();

export {
  decorateStepper,
  onWizardInit,
  aadharLangChange,
};
