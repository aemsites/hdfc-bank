/* eslint no-console: ["error", { allow: ["warn", "error", "debug"] }] */
import {displayLoader, hideLoader} from '../common/makeRestAPI.js';

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
  const ccDetailsWizard = document.querySelector('.form-corporatecardwizardview.field-wrapper.wizard');

  const totalIndex = ccDetailsWizard.style.getPropertyValue('--wizard-step-count');
  Array.from(ccDetailsWizard.children).forEach((child) => {
    if (
      child.tagName.toLowerCase() === 'fieldset' && Number(child.style.getPropertyValue('--wizard-step-index')) !== totalIndex - 1
    ) {
      const stepperLegend = document.querySelector(
        `main .form .form-corporatecardwizardview.field-wrapper.wizard .${child.className.split(' ').join('.')} > legend`,
      );
      stepperLegend?.classList?.add('stepper-style');
    }
  });
}

/**
  * On Wizard Init.
  * @name onWizardInit Runs on initialization of wizard
  */
function onWizardInit() {
  createLabelInElement('.form-permanentaddresstoggle', 'permanent-address-toggle__label');
  decorateStepper();
}

const checkBox1ClickElement = document.getElementsByName('checkBoxConsent1')[0];
const panelAsPopUp = document.getElementsByName('consentPanel1')[0];
const checkBox2ClickElement = document.getElementsByName('checkBoxConsent2')[0];
const panelAsPopUp2 = document.getElementsByName('consentPanel2')[0];

const linkModalFunction = (trigerElement, payload) => {
  trigerElement.addEventListener('click', async (e) => {
    if (e.target.checked) {
      displayLoader('Nothing for now');
      const openModalImport = import('../blocks/modal/modal.js');
      openModalImport.then((modal) => {
        modal.default(payload);
      })
        .catch((err) => console.error(err))
        .finally(hideLoader());
    }
  });
};

const consent1Config = { // config to create modal for consent-1
  content: panelAsPopUp, // content to display in modal
  actionWrapClass: 'form-actionwrapperpanel', // wrapper class containing all the buttons
  reqConsentAgree: true, // Flag indicating whether consent agreement is required or not
};
const consent2Config = { // config to create modal for consent-2
  content: panelAsPopUp2, // content to display in modal
  actionWrapClass: 'form-button-wrapper', // wrapper class containing all the buttons
  reqConsentAgree: false, // Flag indicating whether consent agreement is required or not
};

linkModalFunction(checkBox1ClickElement, consent1Config);
linkModalFunction(checkBox2ClickElement, consent2Config);

export { decorateStepper, onWizardInit };
