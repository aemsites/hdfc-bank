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
  // eslint-disable-next-line no-param-reassign
  journeyAbbreviationValue = FD_EF_CONSTANT.JOURNEY_ABBR_VALUE;
  // eslint-disable-next-line no-param-reassign
  visitMode = 'online';
  // eslint-disable-next-line no-param-reassign
  channelValue = 'WEB';
  const dynamicUUID = generateUUID();
  const journeyId = globals.functions.exportData().form?.journeyId || `${dynamicUUID}_01_${journeyAbbreviationValue}_${visitMode}_${channelValue}`;
  globals.functions.setProperty(globals.form.runtime.journeyId, { value: journeyId });
  globals.functions.setProperty(globals.form.runtime.journeyName, { value: journeyName });
  // Update the form context
  currentFormContext.journeyName = journeyName;
  currentFormContext.journeyID = journeyId;
}

export {
  // eslint-disable-next-line import/prefer-default-export
  createJourneyId,
};
