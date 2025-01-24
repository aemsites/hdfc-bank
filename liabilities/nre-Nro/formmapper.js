import {
    FORM_DATA
  } from './constant.js';

/**
 * Maps form fields to data.
 * @param {Object} globals 
 */
const globalObjectMapper = (globals) => {
    FORM_DATA.form = globals.functions.exportData()?.form;
    debugger;
    console.log(FORM_DATA.form);
}

export {
    globalObjectMapper
};