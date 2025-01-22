import { displayLoader, hideLoaderGif, restAPICall } from '../../common/makeRestAPI.js';
import { moveWizardView } from '../domutils/domutils.js';
import * as FD_EF_CONSTANT from './constant.js';
import { formUtil } from '../../common/formutils.js';

const {
  CURRENT_FORM_CONTEXT: currentFormContext,
  END_POINTS: fdEfEndpoints,
  DATA_CONTRACT,
  INR_CONST,
  DOM_NAME,
} = FD_EF_CONSTANT;

const FD_SIM_API = {
  failureCount: 0,
  triggerPlace: '',
};

// eslint-disable-next-line no-unused-vars
const createFdEfReqPayload = (globals) => {
  const mobileNo = '91' + (globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registeredMobileNumber.$value ?? '');
  const panValue = globals.form.loginMainPanel.loginPanel.identifierPanel.pan.$value ?? '';
  const dobValue = (globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth.$value ?? '')
  .replace(/-/g, '') === 'Date of Birth'
  ? ''
  : (globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth.$value ?? '').replace(/-/g, '');
  const debitAccountNo = currentFormContext?.selectedFundAcct?.accountNumber;
  const principalAmount = {
    amount: String(parseInt(currentFormContext?.selectedFundAcct?.investValue)) ?? '',
    currencyCode: 'INR',
  };
  const {
    createFD: {
      leftWrapper: {
        interestPayout: { interestPayoutOpt },
        tenurePanel: {
          tenureWrapper: { day, months, year },
        },
      },
    },
  } = globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding;
  const INT_PAY_KEYS = ['Reinvestment', 'MIP', 'QIP'];
  const mapInterestPayoust = (interestPayoutOpt.$enum || [])?.reduce((acc, prev, i) => {
    acc[interestPayoutOpt.$enum[i]] = [interestPayoutOpt.$enumNames[i], INT_PAY_KEYS[i]];
    return acc;
  }, {});

  const term = {
    days: day.$value ? String(parseInt(day.$value, 10)) : '',
    months: String((parseInt(year.$value) * 12) + (parseInt(months.$value))) ?? '',
  };
  
  let totalMonths = parseInt(term.months) || 0;
  let totalDays = parseInt(term.days) || 0;
  
  if (totalMonths < 6) {
    totalDays += totalMonths * 30;
    totalMonths = 0;
  }
  
  // Update term based on months <6
  term.days = String(totalDays);
  term.months = String(totalMonths);

  const [_intPayNames, productGroupRaw] = mapInterestPayoust[interestPayoutOpt.$value] ?? '';
  const totalDayspg = (parseInt(term.months) * 30) + parseInt(term.days);
  const productGroup = totalDayspg <= 180 ? 'Days' : productGroupRaw;
  const payload = {
    RequestPayload: {
      SimulateTermDepositRequest: {
        mobileNo,
        operationMode: '5',
        tdSimulationRequestDTO: {
          termDepositFactsDTO: {
            debitAccountNo,
            productGroup,
            principalAmount,
            term,
            dictionaryArray: [
              {
                nameValuePairDTOArray: [
                  {
                    name: 'codTypTd',
                    value: 'C',
                  },
                ],
              },
            ],
          },
        },
        dictionaryArray: [
          {
            nameValuePairDTOArray: [
              {
                name: 'DOB',
                value: dobValue,
              },
              {
                name: 'PAN',
                value: panValue,
              },
              {
                name: 'flgReplicateCASANominee',
                value: 'Y',
              },
              {
                name: 'flgSendSMS',
                value: 'N',
              },
              {
                name: 'makerID',
                value: 'Adobe',
              },
            ],
          },
        ],
      },
      userAgent: window.navigator.userAgent,
      journeyID: globals?.form?.runtime?.journeyId?.$value || currentFormContext?.journeyID,
      journeyName: globals?.form?.runtime?.journeyName?.$value || currentFormContext?.journeyName,
      pseudoID: 'abcd',
    },
  };
  currentFormContext.simulationReqPayload = payload;
  return payload;
};

/**
 * fd-ef-simulation api error handling case
 * @param {object} err - error response
 * @param {object} globals - form scope object
 */
// eslint-disable-next-line no-unused-vars
const fdEfSimErrorCallBack = (err, globals) => {
  if (FD_SIM_API.failureCount === 3) {
    hideLoaderGif();
    // add logics to show if the 3 attempt failed
    globals.functions.setProperty(globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding, { visible: false });
    globals.functions.setProperty(globals.form.fdDetailsWrapper.externalFundingWizardView.simulationErrPage, { visible: true });
  } else {
    // eslint-disable-next-line no-use-before-define
    fdEfSimulationExecute(FD_SIM_API.triggerPlace, globals);
  }
};

/**
 * fdEfSimulation api success case scenario
 * @param {object} res - fd simulation response object
 * @param {object} globals - object
 */
const fdEfSimSuccessCallBack = (res, globals) => {  
  currentFormContext.simulationResponse = res;
  const response = res;
  // const response = DATA_CONTRACT.fdSimResponse;
  const validResponse = ((response?.status?.errorCode === '0') && ((response?.status?.errorMsg) === 'Success'));
  if (validResponse) {
    hideLoaderGif();
    // method to set the response in the correct placess
    const maturity = `${INR_CONST.nfObject.format(parseInt(response?.tdSimulationResponse?.maturityAmount?.amount || 0, 10))} @ ${response?.tdSimulationResponse?.interestRate}p.a`;
    globals.functions.setProperty(globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding.createFD.rightWrapper.maturityDetailsPanel.mDetails, { value: maturity });
    if (FD_SIM_API.triggerPlace === DOM_NAME.wizardSelectAct) {
      moveWizardView(DOM_NAME.wizardPanel, DOM_NAME.wizardCreateFd);
    }
  } else {
    FD_SIM_API.failureCount += 1;
    fdEfSimErrorCallBack(response, globals);
  }
};

/**
 * fdEfSimulationExecute - executes fd-ef simulation api
 * @param {object} triggerPlace - place where api trigger happened
 * @param {object} globals
 * @returns {Promise}
 */
function fdEfSimulationExecute(triggerPlace, globals) {
  const tenureYears = parseInt(globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding.createFD.leftWrapper.tenurePanel.tenureWrapper.year.$value);
  const tenureMonths = parseInt(globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding.createFD.leftWrapper.tenurePanel.tenureWrapper.months.$value);
  const tenureDays = parseInt(globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding.createFD.leftWrapper.tenurePanel.tenureWrapper.day.$value);
  currentFormContext.tenureWhole = (tenureYears ? tenureYears + 'Y, ' : '') + (tenureMonths ? tenureMonths + 'M, ' : '') + (tenureDays ? tenureDays + 'D' : '');
  const interestPayoutPanel = globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding.createFD.leftWrapper.interestPayout;
  const interestPayoutPanelVisibility = formUtil(globals, interestPayoutPanel);
  const isEligibleForInterestPayout = tenureMonths >= 6 || tenureYears >= 1;
  interestPayoutPanelVisibility.visible(isEligibleForInterestPayout);
  const isMakeSimulationAPICall = tenureMonths >= 1 || tenureYears >= 1 || tenureDays >=7;
  if (isMakeSimulationAPICall){
    const urlPath = fdEfEndpoints.fdSimulation;
    const jsonObj = createFdEfReqPayload(globals);
    // const jsonObj = DATA_CONTRACT.fdSimReques;
    FD_SIM_API.triggerPlace = triggerPlace?.$name || triggerPlace?.name;
    displayLoader();
    restAPICall(globals, 'POST', jsonObj, urlPath, fdEfSimSuccessCallBack, fdEfSimErrorCallBack);
  }   
}

export default fdEfSimulationExecute;
