import {
    FORM_DATA
} from './constant.js';

const handler = {
    set(target, property, value) {
        console.log(`Property "${property}" changed from "${target[property]}" to "${value}"`);
        target[property] = value; // Don't forget to update the property
        console.log('again {}', FORM_DATA.form);
        hello(`${property}`, `${value}`);
        return true; // Indicate success
    }
};

const hello = (target, value) => {
    console.log(target);
    console.log(value);
};

/**
 * Maps form fields to data.
 * @param {Object} globals 
 */
const globalObjectMapper = (globals) => {
    FORM_DATA.form = globals.functions.exportData()?.form;
    console.log(FORM_DATA.form);
    modifyValue('helloji');
    
    
}
const proxyMapper = new Proxy(FORM_DATA.form, handler);

/**
 * modifyValue function
 * @param {Object} value 
 */
const modifyValue = (value) => {
    proxyMapper.confirmDetails.addressForTaxPurpose = value;
    console.log(FORM_DATA.form);
}







export {
    globalObjectMapper,
};