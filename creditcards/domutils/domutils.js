// DOM - UTILS - having cer tain dom overing function which has been used in formutils.js by the imported
// and got declared in constant name as - DOM_API.
// search with key - DOM_API to track of all dom function to track in formutils which is used over all the functions.

/**
 * Makes a form field invalid by adding error message and styling through Dom api.
 * If the field already has an error message element, updates its content.
 * If not, creates a new error message element.
 * @param {string} fieldName - The name attribute of the field to make invalid.
 * @param {string} [invalidMsg] - The error message to display. Optional, defaults to an empty string.
 */
const makeFieldInvalid = (fieldName, invalidMsg) => {
  const fieldDescClass = 'field-description';
  const invalidClass = 'field-invalid';
  const invalidPin = document.querySelector(`[name=${fieldName}]`);
  const parentElement = invalidPin?.parentElement;
  if (parentElement) {
    const fd = parentElement?.querySelector(`.${fieldDescClass}`);
    if (fd) {
      fd.textContent = invalidMsg || '';
    } else {
      parentElement?.classList.add(invalidClass);
      const fieldDesc = document.createElement('div');
      fieldDesc.textContent = invalidMsg || '';
      fieldDesc.classList.add(fieldDescClass);
      parentElement.appendChild(fieldDesc);
    }
  }
};

/**
 * Sets data attribute and value on the closest ancestor element with the specified class name.
 * @param {string} elementName - The name of the element to search for.
 * @param {string} fieldValue - The value to check for existence before setting data.
 * @param {string} dataAttribute - The name of the data attribute to set.
 * @param {string} value - The value to set for the data attribute.
 * @param {string} ancestorClassName - The class name of the ancestor element where the data attribute will be set.
 */
const setDataAttributeOnClosestAncestor = (elementName, fieldValue, dataAttribute, value, ancestorClassName) => {
  if (!fieldValue) {
    return;
  }

  // Get the element by name
  const element = document.getElementsByName(elementName)?.[0];

  // If element exists, set data attribute on the closest ancestor with the specified class name
  if (element) {
    const closestAncestor = element.closest(`.${ancestorClassName}`);
    if (closestAncestor) {
      closestAncestor.setAttribute(dataAttribute, value);
    }
  }
};

/**
 * Sets the options of a select element based on the provided option lists.
 * @param {Array<object>} optionLists - An array of objects representing the options to be set.
 * @param {string} elementName - The name attribute of the select element.
 */
const setSelectOptions = (optionLists, elementName) => {
  const selectOption = document.querySelector(`[name=${elementName}]`);
  optionLists?.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option?.value;
    optionElement.textContent = option?.label;
    const parent = selectOption?.parentNode;
    selectOption?.appendChild(optionElement);
    parent?.setAttribute('data-active', true);
  });
};

/**
 * Moves the corporate card wizard view from one step to the next step.
 * @param {String} source - The name attribute of the source element (parent wizard panel).
 * @param {String} target - The name attribute of the destination element.
 */
const moveWizardView = (source, target) => {
  const navigateFrom = document.getElementsByName(source)?.[0];
  const current = navigateFrom?.querySelector('.current-wizard-step');
  const currentMenuItem = navigateFrom?.querySelector('.wizard-menu-active-item');
  const navigateTo = document.getElementsByName(target)?.[0];
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
};

/**
 * Changes the language of the Aadhar content to the specified language.
 * @param {Object} content - The content configuration for Aadhar.
 * @param {string} defaultLang - The language to show us default.
 */
// select dropdow-aadhar
const aadharLangChange = (adharContentDom, defaultLang) => {
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
  selectOp.value = defaultLang;
  selectOp?.addEventListener('change', (e) => {
    e.preventDefault();
    const { value: valueSelected } = e.target;
    selectOp.value = valueSelected;
    const optionClass = `field-aadharconsent-${valueSelected?.toLowerCase()}`;
    applySelected(findFieldSet, optionClass, selectedClass);
  });
};

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

/**
 * Adds the 'wrapper-disabled' class to the parent elements of inputs or selects within the given panel
 * if their values are truthy (or) the name of the panel input is 'middleName'.
 * @param {HTMLElement} selectedPanel - The panel element containing the inputs or selects.
 */
const addDisableClass = (selectedPanel) => {
  const panelInputs = Array.from(selectedPanel.querySelectorAll('input, select'));

  // Iterates over each input or select element
  panelInputs.forEach((panelInput) => {
    // Checks if the input or select element has a truthy value
    if (panelInput.value || panelInput.name === 'middleName') {
      // Adds the 'wrapper-disabled' class to the parent element
      panelInput.parentElement.classList.add('wrapper-disabled');
    }
  });
};

export {
  makeFieldInvalid,
  setDataAttributeOnClosestAncestor,
  setSelectOptions,
  moveWizardView,
  aadharLangChange,
  removeIncorrectOtpText,
  addDisableClass,
};
