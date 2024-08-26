import { displayLoader, fetchJsonResponse } from '../../common/makeRestAPI.js';
import * as SEMI_CONSTANT from './constant.js';
import {
  generateUUID, moveWizardView, urlPath,
} from '../../common/formutils.js';

const {
  CURRENT_FORM_CONTEXT: currentFormContext,
  JOURNEY_NAME: journeyName,
  SEMI_ENDPOINTS: semiEndpoints,
  PRO_CODE,
  DOM_ELEMENT: domElements,
  MISC,
} = SEMI_CONSTANT;

/**
   * generates the journeyId
   * @param {string} visitMode - The visit mode (e.g., "online", "offline").
   * @param {string} journeyAbbreviation - The abbreviation for the journey.
   * @param {string} channel - The channel through which the journey is initiated.
   */
// eslint-disable-next-line no-unused-vars
function generateJourneyId(visitMode, journeyAbbreviation, channel) {
  const dynamicUUID = generateUUID();
  const journeyId = `${dynamicUUID}_01_${journeyAbbreviation}_${visitMode}_${channel}`;
  return journeyId;
}

// Initialize all SEMI Journey Context Variables & formRuntime variables.
currentFormContext.journeyName = journeyName;
currentFormContext.journeyID = generateJourneyId('a', 'b', 'c');


/**
 * function sorts the billed / Unbilled Txn  array in ascending order based on the amount field
 *
 * @param {object} data
 * @returns {object}
 */
const sortTxnAmount = (data) => data.responseString.sort((a, b) => b.amount - a.amount);


/**
 * generates the otp
 * @param {string} mobileNumber
 * @param {string} cardDigits
 * @param {object} globals
 * @return {PROMISE}
 */
function getOTPV1(mobileNumber, cardDigits, globals) {
  globals.functions.setProperty(globals.form.runtime.journeyId, { value: currentFormContext.journeyID });
  currentFormContext.journeyName = SEMI_CONSTANT.JOURNEY_NAME;
  const jsonObj = {
    requestString: {
      mobileNo: mobileNumber,
      cardNo: cardDigits,
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
    },
  };
  const path = semiEndpoints.otpGen;
  displayLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', true);
}

/**
 * generates the otp
 * @param {string} mobileNumber
 * @param {string} cardDigits
 * @param {object} globals
 * @return {PROMISE}
 */
function otpValV1(mobileNumber, cardDigits, otpNumber) {
  const jsonObj = {
    requestString: {
      mobileNo: mobileNumber,
      cardNo: cardDigits,
      OTP: otpNumber,
      proCode: PRO_CODE,
      journeyID: currentFormContext.journeyID,
      journeyName: currentFormContext.journeyName,
      channel: 'WhatsApp',
    },
  };
  const path = semiEndpoints.otpVal;
  displayLoader();
  return fetchJsonResponse(path, jsonObj, 'POST', true);
}

/**
 * sets the data for the instance of repetable panel
 *
 * @param {object} globals - gobal form object
 * @param {Object} panel - The panel for unbilled transactions.
 * @param {Object} txn - current tramsaction object
 * @param {number} i - current instance of panel row
 */
const setData = (globals, panel, txn, i) => {
  globals.functions.setProperty(panel[i]?.aem_TxnAmt, { value: txn?.amount });
  globals.functions.setProperty(panel[i]?.aem_TxnDate, { value: txn?.date });
  globals.functions.setProperty(panel[i]?.aem_TxnID, { value: txn?.id });
  globals.functions.setProperty(panel[i]?.aem_TxnName, { value: txn?.name });
};

/*
 * Displays card details by updating the UI with response data.
 * @param {object} globals - global object
 * @param {object} response - response from the checkEligibilty
 */
const cardDisplay = (globals, response) => {
  const creditCardDisplay = globals.form.aem_semicreditCardDisplay;
  globals.functions.setProperty(creditCardDisplay, { visible: true });
  globals.functions.setProperty(creditCardDisplay.aem_semicreditCardContent.aem_customerNameLabel, { value: `Dear ${response?.cardHolderName}` });
  const nfObject = new Intl.NumberFormat('hi-IN');
  // eslint-disable-next-line radix
  const totalAmt = nfObject.format(parseInt(response.responseString.creditLimit) - Math.round(parseInt(response?.blockCode?.bbvlogn_card_outst) / 100));
  globals.functions.setProperty(creditCardDisplay.aem_semicreditCardContent.aem_outStandingAmt, { value: `${MISC.rupeesUnicode} ${totalAmt}` });
  globals.functions.setProperty(globals.form.aem_semicreditCardDisplay.aem_cardfacia, { value: urlPath(response.cardTypePath) });
  const imageEl = document.querySelector('.field-aem-cardfacia > picture');
  const imagePath = `${urlPath(response.cardTypePath)}?width=2000&optimize=medium`;
  imageEl?.childNodes[5].setAttribute('src', imagePath);
  imageEl?.childNodes[3].setAttribute('srcset', imagePath);
  imageEl?.childNodes[1].setAttribute('srcset', imagePath);
};

const DELAY = 50;
const DELTA_DELAY = 70;

/**
 * Combines transaction data and updates the appropriate panels.
 *
 * @param {Array} allTxn - Array of all transactions.
 * @param {number} [btxn] - Number of billed transactions.
 * @param {Object} billedTxnPanel - The panel for billed transactions.
 * @param {Object} [unBilledTxnPanel] - The panel for unbilled transactions.
 * @param {Object} globals - Global variables and functions.
 */
const setTxnPanelData = (allTxn, btxn, billedTxnPanel, unBilledTxnPanel, globals) => {
  if (!allTxn?.length) return;
  const billedTxn = allTxn.slice(0, btxn);
  const unbilledTxn = allTxn.slice(btxn);
  globals.functions.dispatchEvent(billedTxnPanel, 'setItems', { items: billedTxn });
  globals.functions.dispatchEvent(unBilledTxnPanel, 'setItems', { items: unbilledTxn });
};

/**
* @param {resPayload} Object - checkEligibility response.
* @param {object} globals - global object
* @return {PROMISE}
*/
// eslint-disable-next-line no-unused-vars
function checkELigibilityHandler(resPayload, globals) {
  const response = {};
  try {
    const ccBilledData = resPayload?.ccBilledTxnResponse?.responseString || [];
    const ccUnBilledData = resPayload?.ccUnBilledTxnResponse?.responseString || [];
    const billedTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.billedTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const unBilledTxnPanel = globals.form.aem_semiWizard.aem_chooseTransactions.unbilledTxnFragment.aem_chooseTransactions.aem_TxnsList;
    const allTxn = ccBilledData.concat(ccUnBilledData);
    setTxnPanelData(allTxn, ccBilledData.length, billedTxnPanel, unBilledTxnPanel, globals);
    // Display card and move wizard view
    if (window !== undefined) cardDisplay(globals, resPayload);
    if (window !== undefined) moveWizardView(domElements.semiWizard, domElements.chooseTransaction);
    response.nextscreen = 'success';
    return response;
  } catch (error) {
    response.nextscreen = 'failure';
    return response;
  }
}

/**
 * Continue button on choose transactions.
 *
 * @param {Object} globals - Global variables and functions.
 */
function selectTenure(globals) {
  debugger;
}

export {
  getOTPV1,
  otpValV1,
  checkELigibilityHandler,
  selectTenure,
};
