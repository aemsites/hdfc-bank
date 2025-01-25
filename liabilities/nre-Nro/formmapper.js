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
export async function globalObjectMapper(globals){
    initializeData();   
    await formDataModelling(globals, fatcaResponse);
}

export default async function formDataModelling(globals, jsonObject) {
    for (const [key, value] of Object.entries(datatoformmodel)) {
        const path = value.split('|')[0];
        const type = value.split('|')[1];
        const objVal = deepFindES6(jsonObject, key);
        const element = eval(`${path}`);
        const intercepterModule = await import('./intercepter.js')
        intercepterModule.default(element, key, path, globals, objVal, type);
    }
}

  const deepFindES6 = (o, p) => p.split('.').reduce((a, v) => a[v], o);