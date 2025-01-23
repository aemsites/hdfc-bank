import openModal from '../../blocks/modal/modal.js';
import {
  groupCharacters,
  validatePhoneNumber,
  validatePanInput,
  createLabelInElement,
  setMaxDateToToday,
} from '../domutils/domutils.js';
import { DOM_ELEMENT } from './constant.js';

/**
 * Validates the OTP input field to ensure it contains only digits.
 *
 * @function validateOtpInput
 * @returns {void}
 */
const validateOtpInput = () => {
  if (typeof document === 'undefined') return;
  const otpInputField = document.querySelector('.field-otpnumber input');
  otpInputField.placeholder = '••••••';
  otpInputField.addEventListener('input', () => {
    if (!/^\d+$/.test(otpInputField.value)) {
      otpInputField.value = otpInputField.value.slice(0, -1);
    }
  });
};

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

// conset-1 checbox - modal
const consent1Config = {
  // config to create modal for consent-1
  triggerElement: document.getElementsByName(DOM_ELEMENT.identifyYourself.chekbox1Label)?.[0], // trigger element for calling modalFunction
  content: document.getElementsByName(DOM_ELEMENT.identifyYourself.consent1Content)?.[0], // content to display in modal
  actionWrapClass: DOM_ELEMENT.identifyYourself.modalBtnWrapper, // wrapper class containing all the buttons
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

// consent-2 checkbox - modal
const consent2Config = {
  // config to create modal for consent-2
  triggerElement: document.getElementsByName(DOM_ELEMENT.identifyYourself.chekbox2Label)?.[0], // trigger element for calling modalFunction
  content: document.getElementsByName(DOM_ELEMENT.identifyYourself.consent2Content)?.[0], // content to display in modal
  actionWrapClass: DOM_ELEMENT.identifyYourself.modalBtnWrapper, // wrapper class containing all the buttons
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

linkModalFunction(consent1Config);
linkModalFunction(consent2Config);

const addGaps = (elSelector) => {
  if (typeof document === 'undefined') return;
  const panInputField = document.querySelector(elSelector);
  if (!panInputField) return;
  panInputField.addEventListener('input', () => {
    const vaildInput = validatePanInput(panInputField.value.replace(/\s+/g, ''));
    if (!vaildInput) {
      panInputField.value = panInputField.value.slice(0, -1);
      if (panInputField.value.length > 10) {
        panInputField.value = panInputField.value.slice(0, 9);
      }
    }
    groupCharacters(panInputField, [5, 4]);
  });
};

const addMobileValidation = () => {
  if (typeof document === 'undefined') return;
  const validFirstDigits = ['6', '7', '8', '9'];
  const inputField = document.querySelector('.field-registeredmobilenumber input');
  inputField.addEventListener('input', () => validatePhoneNumber(inputField, validFirstDigits));
};

/**
 * Updates name attribute of customer id radio buttons
 *
 * @function updateElementAttr
 * @returns {void}
 */
const updateElementAttr = () => {
  const custIdRadioButtons = Array.from(document.querySelectorAll('.field-multiplecustidselect input'));
  custIdRadioButtons.forEach((radioButton) => {
    radioButton.setAttribute('name', 'cust-id-radio');
  });
};

/**
 * calls function to update checkbox to label
 *
 * @function changeCheckboxToToggle
 * @returns {void}
 */
const changeCheckboxToToggle = () => {
  createLabelInElement('.field-employeeassistancetoggle', 'employee-assistance-toggle__label');
  createLabelInElement('.field-mailingaddresstoggle', 'mailing-address-toggle__label');
};

const buttonEnableOnCheck = (selector, ctaSelector) => {
  const checkbox = document.querySelector(selector);
  const ctaButton = document.querySelector(ctaSelector);

  checkbox.addEventListener('change', () => {
    ctaButton.disabled = !checkbox.checked;
  });
};

setTimeout(() => {
  [DOM_ELEMENT.identifyYourself.dob, DOM_ELEMENT.personalDetails.dob].forEach((dateField) => setMaxDateToToday(dateField));
  addGaps('.field-pan.char-gap-4 input');
  addMobileValidation();
}, 1200);

export {
  addGaps,
  addMobileValidation,
  validateOtpInput,
  updateElementAttr,
  changeCheckboxToToggle,
  buttonEnableOnCheck,
};
