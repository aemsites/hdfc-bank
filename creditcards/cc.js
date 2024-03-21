/* eslint no-console: ["error", { allow: ["warn", "error", "debug"] }] */
import openModal from '../blocks/modal/modal.js';

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
  decorateStepper();
}

const checkBox2ClickElement = document.getElementsByName('checkBoxConsent2')?.[0];
const panelAsPopUp2 = document.getElementsByName('consentPanel2')?.[0];

const linkModalFunction = (trigerElement, payload) => {
  trigerElement.addEventListener('click', async (e) => {
    if (e.target.checked) {
      openModal(payload);
    }
  });
};

const consent2Config = { // config to create modal for consent-2
  content: panelAsPopUp2, // content to display in modal
  actionWrapClass: 'button-wrapper', // wrapper class containing all the buttons
  reqConsentAgree: false, // Flag indicating whether consent agreement is required or not
};

linkModalFunction(checkBox2ClickElement, consent2Config);

/* Code for floating field label, initialized after DOM is rendered */
const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input[type="email"], .field-wrapper textarea, .field-wrapper select');

inputs.forEach((input) => {
  const wrapper = input.closest('.field-wrapper');
  input.addEventListener('focus', () => {
    wrapper.dataset.active = 'true';
    wrapper.dataset.empty = !input.value;
  });
  input.addEventListener('blur', () => {
    delete wrapper.dataset.active;
    wrapper.dataset.empty = !input.value;
  });
  wrapper.dataset.empty = !input.value;
});

/* End of code for floating field label */

export { decorateStepper, onWizardInit };
