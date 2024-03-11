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

export { decorateStepper, onWizardInit };
