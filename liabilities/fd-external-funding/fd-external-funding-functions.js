import { formUtil } from '../../common/formutils.js';
import { fetchJsonResponse } from '../../common/makeRestAPI.js';
import { createJourneyId } from './fd-ef-journeyutils.js';
import { handleFetchCasaPrefill, updateFundAct } from './fd-ef-prefilutils.js';
import fdEfSimulationExecute from './fd-ef-simulationutils.js';
import fdEfAccOpenExecute from './fd-ef-account-opening.js';
import * as FD_EF_CONSTANT from './constant.js';
import { moveWizardView } from '../domutils/domutils.js';

const {
  CURRENT_FORM_CONTEXT: currentFormContext,
  END_POINTS: fdEfEndpoints,
  DATA_LIMITS,
} = FD_EF_CONSTANT;

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

/**
 * @name fdEfOtpValHandler
 * @param {Object} response
 * @param {Object} globals
 * @return {PROMISE}
 */

function fdEfOtpValHandler(globals) {
  handleFetchCasaPrefill(globals);
  return null;
}

/**
 * function will be trigger on change of inverst amount
 * @name investAmtChangeHandler
 * @param {Object} amtField
 * @return {PROMISE}
 */
function investAmtChangeHandler(amtField, globals) {
  let investValue = (amtField.$value);
  const changeDataAttrObj = { attrChange: true, value: false };
  const investAmtFied = formUtil(globals, amtField);
  const minInvest = DATA_LIMITS?.minInvest;
  const maxInvest = currentFormContext?.selectedFundAcctBal;
  const isValid = ((investValue >= minInvest) && (investValue <= maxInvest));
  investValue = (isValid) ? investValue : currentFormContext?.initialLoadInvestBal;
  investAmtFied.setValue(investValue, changeDataAttrObj);
  currentFormContext.selectedFundAcct.investValue = investValue;
}

/**
 * Sets the masked account number in the create Fd head text,
 *
 * @param {string} acctNo - The account number to be masked and displayed.
 * @param {object} txtField - account field
 * @param {object} globals - global object.
 */
const setAcctInCreateFdTitle = (acctNo, txtField, globals) => {
  const selectedAct = String(acctNo);
  if (selectedAct?.includes('X')) {
    const maskSelectedWithAstrich = selectedAct?.replace('XXXXXXXXXX', '**********');
    const createFdHeadTxt = `It will be linked with your HDFC savings A/c ${maskSelectedWithAstrich}.`;
    const fdFootNoteTxtField = formUtil(globals, txtField);
    fdFootNoteTxtField.setValue(createFdHeadTxt);
  }
};

/**
 * function will be triggered once the radio button of available fund account got selected
 * @name selectFundAcct
 * @param {Object} acctField
 * @return {PROMISE}
 */
function selectFundAcct(acctField, globals) {
  const selectedIndex = Number(acctField.$qualifiedName?.match(/\d+/g)?.[0]);
  const {
    selectAccount: { multipleAccounts: { multipleAccountRepeatable }, investmentAmt },
    createFD,
  } = globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding;
  const accountsPanelData = globals.functions.exportData().multipleAccountRepeatable;
  updateFundAct(accountsPanelData, selectedIndex, multipleAccountRepeatable.$qualifiedName, globals);
  const investAmtFied = formUtil(globals, investmentAmt);
  const changeDataAttrObj = { attrChange: true, value: false };
  const selectedFundAcctBal = (accountsPanelData[selectedIndex].availableBalance);
  const halfOfClearBalance = (selectedFundAcctBal / 2);
  const initialLoadInvestBal = halfOfClearBalance || 0;
  currentFormContext.selectedFundAcct = accountsPanelData[selectedIndex]; // selectedFundAcct data {}
  currentFormContext.selectedFundAcctBal = selectedFundAcctBal; // selected account  {accountRadio, accountNumber, availableBalance, accountType}
  currentFormContext.initialLoadInvestBal = initialLoadInvestBal; // selected account 50% of avl balance .
  // investAmtFied.setValue(initialLoadInvestBal, changeDataAttrObj);
  setAcctInCreateFdTitle(currentFormContext?.selectedFundAcct?.accountNumber, createFD.fdFootNoteTxt, globals); // create fd -foot note, set the account value in that heading.
}

/**
 * @name fdEfSwitchWizard to switch panel visibility
 * @param {string} source -  The source of the card wizard (e.g., 'wizardExternalFunding').
 * @param {string} target -  The target panel to switch to (e.g., 'createFD').
 */
function fdEfSwitchWizard(source, target) {
  moveWizardView(source, target);
}

export {
  getOtpExternalFundingFD,
  createJourneyId,
  fdEfOtpValHandler,
  investAmtChangeHandler,
  selectFundAcct,
  fdEfSimulationExecute,
  fdEfAccOpenExecute,
  fdEfSwitchWizard,
};
