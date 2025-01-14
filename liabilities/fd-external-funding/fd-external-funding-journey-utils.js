import {
    generateUUID,
    urlPath,
    santizedFormDataWithContext,
} from '../../common/formutils.js';
import {
  fetchJsonResponse,
  displayLoader,
} from '../../common/makeRestAPI.js';
import * as EFFD_CONSTANT from './constant.js';
import * as CONSTANT from '../../common/constants.js';

const { ENDPOINTS, CURRENT_FORM_CONTEXT: currentFormContext } = CONSTANT;
const { CHANNEL, JOURNEY_NAME, VISIT_MODE } = EFFD_CONSTANT;

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
    const journeyId = globals.functions.exportData().journeyId || `${dynamicUUID}_01_${journeyAbbreviation}_${visitMode}_${channel}`;
    globals.functions.setProperty(globals.form.runtime.journeyId, { value: journeyId });
    return journeyId;
}

/**
     * @name invokeJourneyDropOff to log on success and error call backs of api calls
     * @param {state} state
     * @param {string} mobileNumber
     * @param {Object} globals - globals variables object containing form configurations.
     * @return {PROMISE}
     */
const invokeJourneyDropOff = async (state, mobileNumber, globals) => {
    const isdCode = (globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.countryCode.$value)?.replace(/[^a-zA-Z0-9]+/g, '');
    const journeyJSONObj = {
      RequestPayload: {
        userAgent: (typeof window !== 'undefined') ? window.navigator.userAgent : 'onLoad',
        leadProfile: {
          mobileNumber: isdCode + mobileNumber,
          isCountryCodeappended: 'true',
          countryCode: isdCode,
        },
        formData: {
          channel: CHANNEL,
          journeyName: globals.form.runtime.journeyName.$value || currentFormContext.journeyName,
          journeyID: globals.form.runtime.journeyId.$value || createJourneyId(VISIT_MODE, JOURNEY_NAME, CHANNEL, globals),
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
    const url = urlPath(ENDPOINTS.journeyDropOff);
    const method = 'POST';
    // return globals.functions.exportData().queryParams.leadId ? fetchJsonResponse(url, journeyJSONObj, method) : null;
    return journeyJSONObj.RequestPayload.formData.journeyID ? fetchJsonResponse(url, journeyJSONObj, method) : null;
};
  
/**
    * @name effdInvokeJourneyDropOffByParam
    * @param {string} mobileNumber
    * @param {string} leadProfileId
    * @param {string} journeyId
    * @return {PROMISE}
    */
// eslint-disable-next-line
const effdInvokeJourneyDropOffByParam = async (mobileNumber, leadProfileId, journeyID, globals) => {
  const journeyJSONObj = {
    RequestPayload: {
      leadProfile: {
      },
      journeyInfo: {
        journeyID: currentFormContext.journeyId,
      },
    },
  };
  const url = urlPath(ENDPOINTS.journeyDropOffParam);
  const method = 'POST';
  if (typeof window !== 'undefined') {
    displayLoader();
  }
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

export {
    invokeJourneyDropOff,
    effdInvokeJourneyDropOffByParam,
    createJourneyId,
    journeyResponseHandlerUtil,
  };