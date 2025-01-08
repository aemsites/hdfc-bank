import { generateUUID } from '../../common/formutils.js';
import { fetchJsonResponse } from '../../common/makeRestAPI.js';
import * as FD_EF_CONSTANT from './constant.js';

const {
  CURRENT_FORM_CONTEXT: currentFormContext,
  JOURNEY_NAME: journeyName,
  END_POINTS: fdEfEndpoints,
} = FD_EF_CONSTANT;

/**
 * generates the journeyId
 * @param {string} visitMode - The visit mode (e.g., "online", "offline").
 * @param {string} journeyAbbreviationValue - The abbreviation for the journey - FD_EXTERNAL_FUNDING / FDEF
 * @param {string} channel - The channel through which the journey is initiated
 * @param {object} globals
 */
function createJourneyId(visitMode, journeyAbbreviationValue, channelValue, globals) {
  const dynamicUUID = generateUUID();
  const journeyId = globals.functions.exportData().smartemi?.journeyId || `${dynamicUUID}_01_${journeyAbbreviationValue}_${visitMode}_${channelValue}`;
  globals.functions.setProperty(globals.form.runtime.journeyId, { value: journeyId });
  // Update the form context
  currentFormContext.journeyName = journeyName;
  currentFormContext.journeyID = journeyId;
}

/**
 * generates the customer identification otp
 * @param {object} mobileNumber
 * @param {object} pan
 * @param {object} dob
 * @param {object} globals
 * @return {PROMISE}
 */
// eslint-disable-next-line no-unused-vars
async function getOtpExternalFundingFD(mobileNumber, pan, dob, globals) {
  const jsonObj = {
    mobileNumber: '918619484593',
    dateOfBirth: '19920910',
    panNumber: '',
    userAgent: window.navigator.userAgent,
    journeyID: globals?.form?.runtime?.journeyId?.$value || currentFormContext?.journeyID,
    journeyName: globals?.form?.runtime?.journeyName?.$value || currentFormContext?.journeyName,
    nriJourney: 'N',
  };
  const urlPath = fdEfEndpoints.otpGen;
  // `${'https://hdfc-uat-04.adobecqms.net'}/content/hdfc_fdforms/api/customeridentificationotpgen.json`
  return fetchJsonResponse(urlPath, jsonObj, 'POST', true);
}

export {
  getOtpExternalFundingFD,
  createJourneyId,
};
