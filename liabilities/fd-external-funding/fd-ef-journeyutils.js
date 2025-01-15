import { generateUUID } from '../../common/formutils.js';
import * as FD_EF_CONSTANT from './constant.js';

const {
  CURRENT_FORM_CONTEXT: currentFormContext,
  JOURNEY_NAME: journeyName,
//   END_POINTS: fdEfEndpoints,
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
  const journeyId = globals.functions.exportData().form?.journeyId || `${dynamicUUID}_01_${journeyAbbreviationValue}_${visitMode}_${channelValue}`;
  globals.functions.setProperty(globals.form.runtime.journeyId, { value: journeyId });
  // Update the form context
  currentFormContext.journeyName = journeyName;
  currentFormContext.journeyID = journeyId;
}

export {
  // eslint-disable-next-line import/prefer-default-export
  createJourneyId,
};
