import {
    FORM_DATA
} from './constant.js';

const validator = {
    get(target, key) {
        if (typeof target[key] === 'object' && target[key] !== null) {
            console.log(target);
            return new Proxy(target[key], validator)
        } else {
            return target[key];
        }
    },
    set(target, property, value) {
        console.log('target, {}', target);
        console.log(`Property "${property}" changed from "${target[property]}" to "${value}"`);
        target[property] = value; // Don't forget to update the property
        //hello(`${property}`, `${value}`);
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
    FORM_DATA.form.confirmDetails.countryOfBirth = 'helloji1';
    const proxyMapper = new Proxy(FORM_DATA.form.confirmDetails, validator);
    proxyMapper.countryOfBirth = 'helloji';
    console.log('here');

}









export {
    globalObjectMapper,
};