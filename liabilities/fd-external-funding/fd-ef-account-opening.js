import { displayLoader, hideLoaderGif, restAPICall } from '../../common/makeRestAPI.js';
import { moveWizardView } from '../domutils/domutils.js';
import * as FD_EF_CONSTANT from './constant.js';
import { formUtil } from '../../common/formutils.js';
import { errorHandlingFDExt } from './fd-ef-error-handler.js'

const {
  CURRENT_FORM_CONTEXT: currentFormContext,
  END_POINTS: fdEfEndpoints,
} = FD_EF_CONSTANT;

const fillSummaryDtls = (data, globals) => {
    const refAccountNumber = globals.form.thankYouPanel.thankYouFragment.thankyouLeftPanel.accountNumber;
    const refAccountNumberField = formUtil(globals, refAccountNumber.referenceNumber);
    refAccountNumberField.setValue(data.termDepositXfaceAccountOpeningResponseDTO.tdaccounTNo);
    const { 
        tyFDholder,
        principalAmtTY,
        tenureTY,
        interestPayoutTY,
        maturityInstructionsTY,
        roiTY,
        tyMaturityAmt,
        tyMaturityDate
      } = globals.form.thankYouPanel.thankYouFragment.thankyouLeftPanel.accountSummary;
      const fields = [
        { key: tyFDholder, 
          value: data.termDepositXfaceAccountOpeningResponseDTO.fixedDepositDetailsDTO.namCustShrt
        },
        { 
          key: principalAmtTY, 
          value: data.termDepositXfaceAccountOpeningResponseDTO.fixedDepositDetailsDTO.tdOrgAmT
        },
        {
          key: tenureTY,
          value: currentFormContext.tenureWhole
        },
        { 
          key: interestPayoutTY, 
          value: currentFormContext.simulationReqPayload.RequestPayload.OpenTermDepositAccountRequest.termDepositXfaceAccountOpeningRequestDTO.productCatagory
        },
        { 
          key: maturityInstructionsTY, 
          value: currentFormContext.renewalInstructionValue
        },
        { 
          key: roiTY, 
          value: data.termDepositXfaceAccountOpeningResponseDTO.fixedDepositDetailsDTO.ratTdInteRest + '% p.a.'
        },    
        { 
          key: tyMaturityAmt, 
          value: data.termDepositXfaceAccountOpeningResponseDTO.fixedDepositDetailsDTO.amtTdMAturity
        },
        { 
          key: tyMaturityDate, 
          value: data.termDepositXfaceAccountOpeningResponseDTO.fixedDepositDetailsDTO.datTDMaturity
        }
      ];
      
      fields.forEach(({ key, value }) => formUtil(globals, key).setValue(value));
}

const createFdEfAccOpenReqPayload = (globals) => {
    const mobileNo = '91' + (globals.form.loginMainPanel.loginPanel.mobilePanel.mobileNumberWrapper.registeredMobileNumber.$value ?? '');
    const panValue = globals.form.loginMainPanel.loginPanel.identifierPanel.pan.$value ?? '';
    const dobValue = (globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth.$value ?? '')
    .replace(/-/g, '') === 'Date of Birth'
    ? ''
    : (globals.form.loginMainPanel.loginPanel.identifierPanel.dateOfBirth.$value ?? '').replace(/-/g, '');
    

    const payload = {
        RequestPayload: {
            OpenTermDepositAccountRequest: {
                termDepositXfaceAccountOpeningRequestDTO: {
                    codAcctNo: currentFormContext?.simulationReqPayload.RequestPayload.SimulateTermDepositRequest.tdSimulationRequestDTO.termDepositFactsDTO.debitAccountNo,
                    intPayAcctNbr: currentFormContext?.simulationReqPayload.RequestPayload.SimulateTermDepositRequest.tdSimulationRequestDTO.termDepositFactsDTO.debitAccountNo,
                    codAutoRenewRedem: currentFormContext.renewalInstructionValue,
                    codCcBrn: "2373",
                    depositAmt: currentFormContext?.simulationReqPayload.RequestPayload.SimulateTermDepositRequest.tdSimulationRequestDTO.termDepositFactsDTO.principalAmount.amount,
                    depositTermDays: currentFormContext?.simulationReqPayload.RequestPayload.SimulateTermDepositRequest.tdSimulationRequestDTO.termDepositFactsDTO.term.days,
                    codLg: "mktg",
                    codLc: "",
                    depositTermMnths: currentFormContext?.simulationReqPayload.RequestPayload.SimulateTermDepositRequest.tdSimulationRequestDTO.termDepositFactsDTO.term.months,
                    holdPattern: "Y",
                    productCatagory: currentFormContext?.simulationReqPayload.RequestPayload.SimulateTermDepositRequest.tdSimulationRequestDTO.termDepositFactsDTO.productGroup,
                    intPayoutMode: currentFormContext?.intPayoutModeValue,
                    codTypTd: "C",
                    makerId: currentFormContext?.simulationReqPayload.RequestPayload.SimulateTermDepositRequest.dictionaryArray[0].nameValuePairDTOArray[4].value,
                    checkerID: "Adobe",
                    flgReplicateCASANominee: "N",
                    flgNomineeFacility: "N"
                },
                mobileNo: mobileNo,
                operationMode: "5",
                password: globals?.form.otpPanelWrapper.otpPanel.otpPanel.otpNumber.$value,
                dictionaryArray: [
                    {
                        nameValuePairDTOArray: [
                            {
                                name: "DOB",
                                value: dobValue
                            },
                            {
                                name: "PAN",
                                value: panValue
                            },
                            {
                                name: "callingApplication",
                                value: "DigitalFD"
                            },
                            {
                                name: "misCode",
                                value: ""
                            }
                        ]
                    }
                ]
            },
            userAgent: window.navigator.userAgent,
            journeyID: globals?.form?.runtime?.journeyId?.$value || currentFormContext?.journeyID,
            journeyName: globals?.form?.runtime?.journeyName?.$value || currentFormContext?.journeyName,
            pseudoID: 'abcd',
        }
    };
    currentFormContext.simulationReqPayload = payload;
    return payload;
  };
  

  /**
   * fdEfAccOpen api success case scenario
   * @param {object} res - fd simulation response object
   * @param {object} globals - object
   */
  const fdEfAccOpenSuccessCallBack = (res, globals) => {  
    currentFormContext.simulationResponse = res;
    const response = res;
    // const response = DATA_CONTRACT.fdSimResponse;
    const validResponse = ((response?.status?.errorCode === '0') && ((response?.status?.errorMsg) === 'Success'));
    if (validResponse) {
      hideLoaderGif();
      const {bannerImagePanel} = globals.form;
      globals.functions.setProperty(bannerImagePanel, { visible: false });      
      globals.functions.setProperty(globals.form.otpPanelWrapper, { visible: false });
      fillSummaryDtls(res, globals);
    }
  };
  
  /**
   * fdEfAccOpenExecute - executes Account Opening api
   * @param {object} globals
   * @returns {Promise}
   */
  function fdEfAccOpenExecute(globals) {
      const urlPath = fdEfEndpoints.accOpening;
      const jsonObj = createFdEfAccOpenReqPayload(globals);
      // const jsonObj = DATA_CONTRACT.fdSimReques;
      displayLoader();
      restAPICall(globals, 'POST', jsonObj, urlPath, fdEfAccOpenSuccessCallBack, errorHandlingFDExt);
  }
  

export default fdEfAccOpenExecute;