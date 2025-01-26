import {
    FORM_DATA
} from './constant.js';

import { fatcaResponse } from './fatca.js';
import { datatoformmodel } from './formtodatamodel.js';
import { CURRENT_FORM_CONTEXT } from '../../common/constants.js';
import Observer from './observer.js';
import { data } from './nreNroAnalyticsConstants.js';



let globalsObj = {};

export function setData(key, datatomap) {
    CURRENT_FORM_CONTEXT.DATA[`${key}`] = datatomap;
}

export function initializeData() {
    CURRENT_FORM_CONTEXT['DATA'] = {};
}

/**
 * Maps form fields to data.
 * @param {Object} globals 
 */
export async function globalObjectMapper(globals) {
    initializeData();
    await formDataModelling(globals, fatcaResponse);
}

export default async function formDataModelling(globals, jsonObject) {
    let objValArr = [];
    let typeArr = [];
    for (const [key, value] of Object.entries(datatoformmodel)) {
        if (Array.isArray(value)) {
            for (const val of value) {
                const jsonObjectPath = val.split('|')[0];
                const type = val.split('|')[1];
                let prop = deepFindES6(jsonObject, jsonObjectPath);
                objValArr.push(prop);
                typeArr.push(type);
            }
        } else {
            const jsonObjectPath = value.split('|')[0];
            const type = value.split('|')[1];
            let prop = deepFindES6(jsonObject, jsonObjectPath);
            objValArr.push(prop);
            typeArr.push(type);
        }
        const element = eval(`${key}`);
        const intercepterModule = await import('./intercepter.js')
        intercepterModule.default(element, globals, objValArr, typeArr);
        objValArr = [];
        typeArr = [];
    }
}

const deepFindES6 = (o, p) => p.split('.').reduce((a, v) => a[v], o);