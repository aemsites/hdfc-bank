/* eslint no-bitwise: ["error", { "allow": ["^", ">>", "&"] }] */

import { santizedFormData } from './formutils.js';
import { fetchJsonResponse } from './makeRestAPI.js';

function generateUUID() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
}

/**
 * generates the journeyId
 *
 * @param {string} visitMode - The visit mode (e.g., "online", "offline").
 * @param {string} journeyAbbreviation - The abbreviation for the journey.
 * @param {string} channel - The channel through which the journey is initiated.
 * @returns {string} - The generated journey ID.
 */
function createJourneyId(visitMode, journeyAbbreviation, channel) {
  const dynamicUUID = generateUUID();
  // var dispInstance = getDispatcherInstance();
  const journeyId = `${dynamicUUID}_01_${journeyAbbreviation}_${visitMode}_${channel}`;
  return journeyId;
}

const currentFormContext = {};

/**
 * invokeJourneyApiCall to log on success and error call backs of api calls.
 * @param {Object} globals - globals variables object containing form configurations.
 */
const invokeJourneyApiCall = async (state, globals) => {
  const journeyJSONObj = {
    RequestPayload: {
      userAgent: window.navigator.userAgent,
      leadProfile: {},
      formData: {
        channel: 'ADOBE WEBFORMS',
        journeyName: currentFormContext.journeyName,
        journeyID: currentFormContext.journeyID,
        journeyStateInfo: [
          {
            state,
            stateInfo: JSON.stringify(santizedFormData(globals)),
            timeinfo: new Date().toISOString(),
          },
          {
            state,
            stateInfo: JSON.stringify(santizedFormData(globals)),
            timeinfo: new Date().toISOString(),
          },
        ],
      },
    },
  };
  const url = 'https://applyonlinedev.hdfcbank.com/content/hdfc_commonforms/api/journeydropoff.json';
  const method = 'POST';
  try {
    const jsonApiCall = await fetchJsonResponse(url, journeyJSONObj, method);
    // success method proceed
    // eslint-disable-next-line no-console
    console.log(jsonApiCall, 'journeyapicall_response');
  } catch (error) {
    // error method proceed
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

export {
  createJourneyId,
  currentFormContext,
  invokeJourneyApiCall,
};
