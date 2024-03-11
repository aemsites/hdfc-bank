import openModal from '../common/components/modal/modal.js';

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

function addLegend() {
  const inputs = document.querySelectorAll('.field-wrapper input');
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
    // Initialize the state based on the input's current value
    wrapper.dataset.empty = !input.value;
  });
}

const checkBox1ClickElement = document.getElementsByName('consentCheckBox1')[0];
const checkBox1ContentElement = document.getElementsByClassName('form-consent1text')[0];
// const checkBox1ContentElement = document.getElementsByClassName('form-consent1-text')[0];
const checkBox1agreeButton = document.getElementsByName('iAgreeConsent1')[0];

const linkModalFunction = (trigerElement, innerElement, agreeBtn) => {
  trigerElement.addEventListener('click', async (e) => {
    if (e.target.checked) {
      openModal(innerElement, agreeBtn);
    }
  });
};

linkModalFunction(checkBox1ClickElement, checkBox1ContentElement, checkBox1agreeButton);

export { decorateStepper, onWizardInit };
