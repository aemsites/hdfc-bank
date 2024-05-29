/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import {
  getOTP,
  otpValidation,
  getThisCard,
  prefillForm,
  getAddressDetails,
  pinCodeMaster,
  validateEmailID,
  currentAddressToggleHandler,
  finalDap,
  aadharInit,
  checkMode,
  otpValHandler,
  customSetFocus,
  journeyResponseHandler,
  currentFormContext,
  createJourneyId,
  validatePan,
  panAPISuccesHandler,
  executeInterfaceApi,
  ipaRequestApi,
  ipaSuccessHandler,
  sendAnalytics,
  aadharConsent123,
  resendOTP,
} from '../../common/functions.js';

import { moveWizardView } from '../../common/formutils.js';
import {
  sendSubmitClickEvent,
  sendGenericClickEvent,
} from '../../common/analytics.js';
import { hideLoaderGif } from '../../common/makeRestAPI.js';
import { invokeJourneyDropOff, invokeJourneyDropOffByParam, invokeJourneyDropOffUpdate } from '../../common/journey-utils.js';

/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */

function getFullName(firstname, lastname) {
  // eslint-disable-next-line no-param-reassign
  firstname = firstname == null ? '' : firstname;
  // eslint-disable-next-line no-param-reassign
  lastname = lastname == null ? '' : lastname;
  return firstname.concat(' ').concat(lastname);
}

/**
 * Creates a label element and appends it to a specified element in the DOM.
 * @param {string} elementSelector - The CSS selector for the target element.
 * @param {string} labelClass - The class to be applied to the created label element.
 * @returns {void}
 */
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
    console.error(`Element with selector '${elementSelector}' not found.`);
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

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * getFormContext - returns form context.
 * @returns {Promise} currentFormContext
 */
function getFormContext() {
  return currentFormContext;
}

/**
 * getWrappedFormContext - returns form context.
 * @returns {Promise} currentFormContext
 */
function getWrappedFormContext() {
  const formContext = {
    formContext: currentFormContext,
  };
  return formContext;
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName,
  onWizardInit,
  getOTP,
  otpValidation,
  days,
  getThisCard,
  prefillForm,
  getAddressDetails,
  pinCodeMaster,
  validateEmailID,
  currentAddressToggleHandler,
  finalDap,
  journeyResponseHandler,
  aadharInit,
  moveWizardView,
  checkMode,
  otpValHandler,
  customSetFocus,
  getFormContext,
  sendGenericClickEvent,
  sendSubmitClickEvent,
  getWrappedFormContext,
  hideLoaderGif,
  createJourneyId,
  validatePan,
  panAPISuccesHandler,
  executeInterfaceApi,
  ipaRequestApi,
  ipaSuccessHandler,
  invokeJourneyDropOff,
  invokeJourneyDropOffByParam,
  invokeJourneyDropOffUpdate,
  sendAnalytics,
  aadharConsent123,
  resendOTP,
};
