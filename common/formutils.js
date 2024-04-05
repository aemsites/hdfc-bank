/* eslint-disable no-underscore-dangle */
// declare-CONSTANTS
const DEFAULT_BASE_PATH = 'https://applyonlinedev.hdfcbank.com'; // baseApiUrl for default
const DATA_ATTRIBUTE_EMPTY = 'data-empty';
const ANCESTOR_CLASS_NAME = 'field-wrapper';

/**
 * Generates the full API path based on the environment.
 * @param {string} uri - The endpoint to be appended to the base URL.
 * @returns {string} - The complete API URL including the base URL and the provided endpoint.
 */

const urlPath = (path) => `${DEFAULT_BASE_PATH}${path}`;

/**
 * Masks a number by replacing the specified number of leading digits with asterisks.
 * @param {number} number - The number to mask.
 * @param {number} digitsToMask - The number of leading digits to mask.
 * @returns {string} -The masked number as a string.
 */

const maskNumber = (number, digitsToMask) => {
  if (!number || Number.isNaN(number)) return '******';
  const regex = new RegExp(`^(\\d{${digitsToMask}})`);
  return number.toString().replace(regex, '*'.repeat(digitsToMask));
};

/**
 * Removes spaces and special characters from a given string.
 * @param {string} str - The input string to be cleaned
 * @returns {string} - The input string with spaces and special characters removed.
 */
const clearString = (str) => (str ? str?.replace(/[\s~`!@#$%^&*(){}[\];:"'<,.>?/\\|_+=-]/g, '') : '');

/**
 * Utility function for managing properties of a panel.
 * @param {object} globalObj - The global object containing functions.
 * @param {object} panelName - The name of the panel to manipulate.
 * @returns {void}
 */

const formUtil = (globalObj, panelName) => ({
  /**
    * Sets the visibility of the panel.
    * @param {boolean} val -The visibility value to set.
    * @returns {void}
    */
  visible: (val) => {
    globalObj.functions.setProperty(panelName, { visible: val });
  },
  /**
    * Sets the enabled/disabled state of the panel.
    * @param {boolean} val -The enabled/disabled value to set.
    * @returns {void}
    */

  enabled: (val) => {
    globalObj.functions.setProperty(panelName, { enabled: val });
  },
  /**
 * Sets the value of a panel and updates the data attribute if specified.
 * @param {any} val - The value to set for the panel.
 * @param {Object} changeDataAttr - An object containing information about whether to change the data attribute.
 * @param {boolean} changeDataAttr.attrChange - Indicates whether to change the data attribute.
 * @param {string} changeDataAttr.value - The value to set for the data attribute.
 */
  setValue: (val, changeDataAttr) => {
    globalObj.functions.setProperty(panelName, { value: val });
    if (changeDataAttr?.attrChange && val) {
      const element = document.getElementsByName(panelName._data.$_name)?.[0];
      if (element) {
        const closestAncestor = element.closest(`.${ANCESTOR_CLASS_NAME}`);
        if (closestAncestor) {
          closestAncestor.setAttribute(DATA_ATTRIBUTE_EMPTY, changeDataAttr.value);
        }
      }
    }
  },
});

/**
 * Gets a formatted timestamp from the provided current time.
 *
 * @param {Date} currentTime The current time to generate the timestamp from.
 * @returns {string} The formatted timestamp in 'YYYYMMDDHHmmss' format.
 */
const getTimeStamp = (currentTime) => {
  // Function to pad single digit numbers with leading zero
  const pad = (number) => ((number < 10) ? `0${number}` : number);
  // Format the datetime as desired
  const formattedDatetime = currentTime.getFullYear()
    + pad(currentTime.getMonth() + 1)
    + pad(currentTime.getDate())
    + pad(currentTime.getHours())
    + pad(currentTime.getMinutes())
    + pad(currentTime.getSeconds());
  return formattedDatetime;
};

/**
 * Converts a date string from 'YYYYMMDD' format to a localized date string.
 * @param {string} date - The date string in 'YYYYMMDD' format.
 * @returns {string} The formatted date string in 'MMM DD, YYYY' format.
 */
const convertDateToMmmDdYyyy = (date) => {
  // Extract year, month, and day parts from the input date string
  const year = date.slice(0, 4);
  const month = date.slice(4, 6).padStart(2, '0'); // Ensures zero padding for single-digit months
  const day = date.slice(6, 8).padStart(2, '0'); // Ensures zero padding for single-digit days

  // Define options for the localized date string
  const options = { month: 'short', day: 'numeric', year: 'numeric' };

  // Create a new Date object and convert it to a localized date string
  return new Date(year, month - 1, day).toLocaleDateString('en-US', options);
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
 * Validates if a given date of birth falls within a specified age range.
 * @param {Number} minAge - minAge The minimum age in years.
 * @param {Number} maxAge - maxAge The maximum age in years.
 * @param {String | Date} dobValue - obValue The date of birth value to validate. It can be either a string in ISO format (e.g., "YYYY-MM-DD") or a Date object.
 * @returns {Boolean} - True if the date of birth falls within the specified age range; otherwise, false.
 */
const ageValidator = (minAge, maxAge, dobValue) => {
  const ipDobValue = new Date(dobValue);
  const age = Math.floor((Date.now() - ipDobValue.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return (age >= minAge && age <= maxAge);
};

/**
 * Validates if a given string is a valid PAN (Permanent Account Number) format.
 * @param {String} panValue - The PAN value to validate.
 * @returns {Boolean} - True if the given string is a valid PAN format; otherwise, false.
 */
const panValidator = (panValue) => {
  const valueToUpperCase = panValue?.toUpperCase();
  const regex = /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]{1}$/;
  const valid = regex.test(valueToUpperCase);
  return valid;
};

export {
  urlPath, maskNumber, clearString, formUtil, getTimeStamp, convertDateToMmmDdYyyy, setDataAttributeOnClosestAncestor, ageValidator, panValidator,
};
