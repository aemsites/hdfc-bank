/* eslint no-bitwise: ["error", { "allow": ["^", ">>", "&"] }] */

import {
  santizedFormDataWithContext,
  urlPath,
} from './formutils.js';
import { fetchJsonResponse } from './makeRestAPI.js';
import corpCreditCard from './constants.js';

const { endpoints } = corpCreditCard;

function generateUUID() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
}

/**
 * generates the journeyId
 * @param {string} visitMode - The visit mode (e.g., "online", "offline").
 * @param {string} journeyAbbreviation - The abbreviation for the journey.
 * @param {string} channel - The channel through which the journey is initiated.
 * @param {object} globals
 */
function createJourneyId(visitMode, journeyAbbreviation, channel, globals) {
  const dynamicUUID = generateUUID();
  // var dispInstance = getDispatcherInstance();
  const journeyId = `${dynamicUUID}_01_${journeyAbbreviation}_${visitMode}_${channel}`;
  globals.functions.setProperty(globals.form.runtime.journeyId, { value: journeyId });
}

const currentFormContext = {};
const formRuntime = {};

const getCurrentContext = () => currentFormContext;

const setCurrentContext = (formContext) => {
  this.currentFormContext = formContext;
  if (!this.currentFormContext.isSet) {
    this.currentFormContext.isSet = true;
  }
};

/**
 * @name invokeJourneyDropOff to log on success and error call backs of api calls
 * @param {state} state
 * @param {string} mobileNumber
 * @param {Object} globals - globals variables object containing form configurations.
 * @return {PROMISE}
 */
const invokeJourneyDropOff = async (state, mobileNumber, globals) => {
  const journeyJSONObj = {
    RequestPayload: {
      userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
      leadProfile: {
        mobileNumber,
      },
      formData: {
        channel: corpCreditCard.channel,
        journeyName: corpCreditCard.journeyName,
        journeyID: globals.form.runtime.journeyId.$value,
        journeyStateInfo: [
          {
            state,
            stateInfo: JSON.stringify(santizedFormDataWithContext(globals)),
            timeinfo: new Date().toISOString(),
          },
        ],
      },
    },
  };
  const url = urlPath(endpoints.journeyDropOff);
  const method = 'POST';
  return fetchJsonResponse(url, journeyJSONObj, method);
};

/**
 * @name invokeJourneyDropOffUpdate
 * @param {string} state
 * @param {string} mobileNumber
 * @param {string} leadProfileId
 * @param {string} journeyId
 * @param {Object} globals - globals variables object containing form configurations.
 * @return {PROMISE}
 */
const invokeJourneyDropOffUpdate = async (state, mobileNumber, leadProfileId, journeyId, globals) => {
  const sanitizedFormData = santizedFormDataWithContext(globals, currentFormContext);
  const journeyJSONObj = {
    RequestPayload: {
      userAgent: window.navigator.userAgent,
      leadProfile: {
        mobileNumber,
        leadProfileId: leadProfileId.toString(),
      },
      formData: {
        channel: corpCreditCard.channel,
        journeyName: currentFormContext.journeyName,
        journeyID: journeyId,
        journeyStateInfo: [
          {
            state,
            stateInfo: JSON.stringify(sanitizedFormData),
            timeinfo: new Date().toISOString(),
          },
        ],
      },
    },
  };
  // sendSubmitClickEvent(mobileNumber, linkName, sanitizedFormData);
  const url = urlPath(endpoints.journeyDropOffUpdate);
  const method = 'POST';
  return fetchJsonResponse(url, journeyJSONObj, method);
};

/**
 * @name printPayload
 * @param {string} payload.
 * @param {object} formContext.
 * @returns {object} currentFormContext.
 */
function journeyResponseHandlerUtil(payload, formContext) {
  formContext.leadProfile = {};
  formContext.leadProfile.leadProfileId = String(payload);
  return formContext;
}

/**
* @name invokeJourneyDropOffByParam
* @param {string} mobileNumber
* @param {string} leadProfileId
* @param {string} journeyId
* @return {PROMISE}
*/
const invokeJourneyDropOffByParam = async (mobileNumber, leadProfileId, journeyID) => {
  const journeyJSONObj = {
    RequestPayload: {
      leadProfile: {
        mobileNumber,
      },
      journeyInfo: {
        journeyID,
      },
    },
  };
  const url = urlPath(endpoints.journeyDropOffParam);
  const method = 'POST';
  return fetchJsonResponse(url, journeyJSONObj, method);
};

export {
  invokeJourneyDropOff, invokeJourneyDropOffByParam, invokeJourneyDropOffUpdate, journeyResponseHandlerUtil, currentFormContext, getCurrentContext, setCurrentContext, createJourneyId, formRuntime,
};
