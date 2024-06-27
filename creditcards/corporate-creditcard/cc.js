/* eslint-disable no-tabs */
/* eslint no-console: ["error", { allow: ["warn", "error", "debug"] }] */
import openModal from '../../blocks/modal/modal.js';

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

const errorPannelMethod = () => {
  const errorPannel = document.getElementsByName('errorResultPanel')?.[0];
  const resultPanel = document.getElementsByName('resultPanel')?.[0];
  resultPanel.setAttribute('data-visible', true);
  errorPannel.setAttribute('data-visible', true);
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

const successPannelMethod = (applRefNum) => {
  const resultPanel = document.getElementsByName('resultPanel')?.[0];
  const successPanel = document.getElementsByName('successResultPanel')?.[0];
  resultPanel.setAttribute('data-visible', true);
  successPanel.setAttribute('data-visible', true);
  setArnNumberInResult(applRefNum);
};

// post-redirect-aadhar-or-idcom
const searchParam = new URLSearchParams(window.location.search);
const visitTypeParam = searchParam.get('visitType');
const authModeParam = searchParam.get('authmode');
const journeyId = searchParam.get('journeyId');
const aadharRedirect = visitTypeParam && (visitTypeParam === 'EKYC_AUTH');
const idComRedirect = authModeParam && (authModeParam === 'DebitCard');
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
    displayLoader();
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
      return fetch(url, {
        method,
        body: JSON.stringify(journeyJSONObj),
        mode: 'cors',
        headers: {
          'Content-type': 'text/plain',
          Accept: 'application/json',
        },
      })
        .then((res) => res.json()).then((res) => {
          hideLoaderGif();
          const data = res;
          const journeyDropOffParamLast = data.formData.journeyStateInfo[data.formData.journeyStateInfo.length - 1];
          const checkFinalDapSuccess = (journeyDropOffParamLast.state === 'FINAL_DAP_SUCCESS');
          if (checkFinalDapSuccess) {
            const { currentFormContext: { ARN_NUM, VKYC_URL } } = JSON.parse(journeyDropOffParamLast.stateInfo);
            successPannelMethod(ARN_NUM);
            // eslint-disable-next-line no-console
            console.log(VKYC_URL);
            // const vkycProceedButton = document.getElementsByName('vkycProceedButton')?.[0];
            // vkycProceedButton.addEventListener('click', (e) => {
            //   window.location.href = VKYC_URL;
            // });
          } else {
            // errror
            const err = 'badResponse';
            throw err;
          }
        }).catch((e) => {
          hideLoaderGif();
          errorPannelMethod();
          // eslint-disable-next-line no-console
          console.log(e, 'dropoffParamCC.JS');
        });
    };
    setTimeout(() => {
      invokeJourneyDropOffByParam('', '', journeyId);
    }, 20000);
  }
};
pageRedirected(aadharRedirect, idComRedirect);

/**
 * Hides the incorrect OTP text message when the user starts typing in the OTP input field.
 */
const removeIncorrectOtpText = () => {
  const otpNumFormName = 'otpNumber';// constantName-otpNumberfieldName
  const otpNumbrQry = document.getElementsByName(otpNumFormName)?.[0];
  const incorectOtp = document.querySelector('.field-incorrectotptext');
  otpNumbrQry?.addEventListener('input', (e) => {
    if (e.target.value) {
      incorectOtp.style.display = 'none';
    }
  });
};
removeIncorrectOtpText();
