import { displayLoader, hideLoaderGif, restAPICall } from '../../common/makeRestAPI.js';
import { moveWizardView } from '../domutils/domutils.js';
import * as FD_EF_CONSTANT from './constant.js';

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
//   const mobileNo = globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registeredMobileNumber.$value ?? '';
//   const panValue = globals.form.loginMainPanel.loginPanel.identifierPanel.pan.$value ?? '';
//   const dobValue = globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth.$value ?? '';
  const mobileNo = '918619484593';
  const panValue = '';
  const dobValue = '19920910';
  //
  const debitAccountNo = currentFormContext?.selectedFundAcct?.accountNumber;
  const principalAmount = {
    amount: String(currentFormContext?.selectedFundAcct?.investValue) ?? '',
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
  } = globals.form.wizardWrapper.wizardExternalFunding;
  const INT_PAY_KEYS = ['OnMaturity', 'MIP', 'QIP']; // OnMaturity or Reinvestment in api.
  const mapInterestPayoust = (interestPayoutOpt.$enum || [])?.reduce((acc, prev, i) => {
    acc[interestPayoutOpt.$enum[i]] = [interestPayoutOpt.$enumNames[i], INT_PAY_KEYS[i]];
    return acc;
  }, {});
  // eslint-disable-next-line no-unused-vars
  const [_intPayNames, productGroup] = mapInterestPayoust[interestPayoutOpt.$value] ?? '';
  const term = {
    days: day.$value ?? '',
    months: String((year.$value * 12) + (months.$value)) ?? '',
  };
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
    globals.functions.setProperty(globals.form.wizardWrapper.wizardExternalFunding, { visible: false });
    globals.functions.setProperty(globals.form.wizardWrapper.simulationErrPage, { visible: true });
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
  // const response = res;
  const response = DATA_CONTRACT.fdSimResponse;
  const validResponse = ((response?.status?.errorCode === '0') && ((response?.status?.errorMsg) === 'Success'));
  if (validResponse) {
    hideLoaderGif();
    // method to set the response in the correct placess
    const maturity = `${INR_CONST.nfObject.format(parseInt(response?.tdSimulationResponse?.maturityAmount?.amount || 0, 10))} @ ${response?.tdSimulationResponse?.interestRate}p.a`;
    globals.functions.setProperty(globals.form.wizardWrapper.wizardExternalFunding.createFD.rightWrapper.maturityDetailsPanel.mDetails, { value: maturity });
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
  const urlPath = fdEfEndpoints.fdSimulation;
  // const jsonObj = createFdEfReqPayload(globals);
  const jsonObj = DATA_CONTRACT.fdSimReques;
  FD_SIM_API.triggerPlace = triggerPlace?.$name || triggerPlace?.name;
  displayLoader();
  restAPICall(globals, 'POST', jsonObj, urlPath, fdEfSimSuccessCallBack, fdEfSimErrorCallBack);
}

export default fdEfSimulationExecute;
