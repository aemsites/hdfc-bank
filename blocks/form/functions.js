/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */

import { getOTP, otpValidation } from '../../common/functions.js';

function getFullName(firstname, lastname) {
  // eslint-disable-next-line no-param-reassign
  firstname = (firstname == null) ? '' : firstname;
  // eslint-disable-next-line no-param-reassign
  lastname = (lastname == null) ? '' : lastname;
  return firstname.concat(' ').concat(lastname);
}

/**
 * Decorates the stepper for CC yourDetails panel
 * @name decorateStepper Runs after yourDetails panel is initialized
 */
function decorateStepper() {
  const ccDetailsWizard = document.querySelector('.form-corporatecardwizardview.field-wrapper.wizard');

  const totalIndex = ccDetailsWizard.style.getPropertyValue('--wizard-step-count');
  Array.from(ccDetailsWizard.children).forEach((child) => {
    if (child.tagName.toLowerCase() === 'fieldset' && (Number(child.style.getPropertyValue('--wizard-step-index')) !== totalIndex - 1)) {
      const stepperLegend = document.querySelector(`main .form .form-corporatecardwizardview.field-wrapper.wizard .${child.className.split(' ').join('.')} > legend`);
      stepperLegend?.classList?.add('stepper-style');
    }
  });
}

/**
 * On Wizard Init.
 * @name onWizardInit Runs on initialization of wizard
 */
function onWizardInit() {
  decorateStepper();
}

export {
  getFullName, onWizardInit, getOTP, otpValidation,
};
