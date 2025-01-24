import {
    FORM_DATA
  } from './constant.js';

/**
 * Maps form fields to data.
 * @param {Object} globals 
 */
const globalObjectMapper = (globals) => {
    FORM_DATA = globals.functions.exportData()?.form;
    console.log(FORM_DATA);
}

export {
    globalObjectMapper
};