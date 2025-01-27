import * as FD_EF_CONSTANT from './constant.js';
import { formUtil } from '../../common/formutils.js';

const {
  CURRENT_FORM_CONTEXT: currentFormContext,
  DATA_CONTRACT,
} = FD_EF_CONSTANT;

const getAcctPanelData = async (accArr) => {
  const data = accArr || [];
  return data?.map((acct) => {
    const accountRadio = acct?.RadioVal || acct?.accountRadio || null;
    const accountNumber = acct?.accountNumber || 'nill';
    const availableBalance = (parseInt((((acct?.clearBalance || acct?.availableBalance) || 0)), 10)) || '0';
    const accountType = acct?.productType || acct?.accountType || 'account type';
    const accountDtls = { accountNumber, availableBalance, accountType };
    return ({
      accountRadio, accountNumber, availableBalance, accountType, accountDtls,
    });
  });
};

const fillActDtls = (data, globals) => {
  const multAct = globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding.selectAccount.multipleAccounts.multipleAccountRepeatable;
  (data || [])?.forEach(({ accountDtls: { accountNumber, availableBalance, accountType } }, i) => {
    const actNo = `${accountType} ${String(accountNumber)?.replace('XXXXXXXXXX', '**********')}`;
    const avlBal = `Available balance: ${FD_EF_CONSTANT.INR_CONST.nfObject.format(availableBalance)}`;
    globals.functions.setProperty(multAct[i].accountDtls.accountNumber, { value: actNo });
    globals.functions.setProperty(multAct[i].accountDtls.availableBalance, { value: avlBal });
  });
};

const updateFundAct = async (casaAcctDetails, selectedRadioBtnIndex, multipleAcctQName, globals) => {
  const acctDetailsArrObj = casaAcctDetails || [];
  const pannelData = await getAcctPanelData(acctDetailsArrObj) || [];
  const acctData = pannelData?.map((rBtn, i) => ({ ...rBtn, accountRadio: (i === selectedRadioBtnIndex) ? '0' : undefined }));
  globals.functions.importData(acctData, multipleAcctQName);
  setTimeout(() => {
    // import method didn't work if the fileds got a wrapped which inside repeatables. Hence used the setProperty method for the actDtls.
    fillActDtls(acctData, globals);
  }, 0);
};

const updateReviewPage = async (globals) => {
  const { 
    fundingAccount: { accountNumberReview }, 
    fixedDeposit: { principalAmount },
    fixedDeposit: { tenureReview },
    fixedDeposit: { interestPayoutReview },
    fixedDeposit: { maturityInstructionReview },
    fixedDeposit: { roiReview },
    fixedDeposit: { maturityAmountReview },
    fixedDeposit: { maturityDateReview },
  } = globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding.review.confirmDetailsAccordion;
  
  const renewalInstructionLabels = ['Renew Principle and Interest', 'Renew Principal only', 'Do not renew'];
  const renewalInstructionValue = globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding.createFD.leftWrapper.renewalInstructions.selectAnyone.$value;
  const renewalInstructionLabel = renewalInstructionLabels[renewalInstructionValue - 1] || "Unknown";
  currentFormContext.renewalInstructionValue = renewalInstructionValue;
  const intPayoutMode = (parseInt(renewalInstructionValue) === 1 || parseInt(renewalInstructionValue) === 3) ? "2" : (parseInt(renewalInstructionValue) === 2 ? "0" : intPayoutMode);
  currentFormContext.intPayoutModeValue = intPayoutMode;

  const rawMaturityDate = currentFormContext.simulationResponse.tdSimulationResponse.maturityDate.dateString;
  const formattedMaturityDate = formatDate(rawMaturityDate);

  const fields = [
    { key: accountNumberReview, 
      value: currentFormContext.selectedFundAcct.accountNumber
    },
    { 
      key: principalAmount, 
      value: currentFormContext.simulationReqPayload.RequestPayload.SimulateTermDepositRequest.tdSimulationRequestDTO.termDepositFactsDTO.principalAmount.amount
    },
    {
      key: tenureReview,
      value: currentFormContext.tenureWhole
    },
    { 
      key: interestPayoutReview, 
      value: currentFormContext.simulationReqPayload.RequestPayload.SimulateTermDepositRequest.tdSimulationRequestDTO.termDepositFactsDTO.productGroup
    },
    { 
      key: maturityInstructionReview, 
      value: renewalInstructionLabel
    },
    { 
      key: roiReview, 
      value: currentFormContext.simulationResponse.tdSimulationResponse.interestRate + '% p.a.'
    },    
    { 
      key: maturityAmountReview, 
      value: currentFormContext.simulationResponse.tdSimulationResponse.maturityAmount.amount
    },
    { 
      key: maturityDateReview, 
      value: formattedMaturityDate
    }
  ];
  
  fields.forEach(({ key, value }) => formUtil(globals, key).setValue(value));
  
}

function formatDate(rawDate) {
  const year = rawDate.slice(0, 4);
  const month = rawDate.slice(4, 6) - 1;
  const day = rawDate.slice(6, 8);
  const date = new Date(year, month, day);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return formatter.format(date).replace(',', ''); // Example: "21 Nov 2025"
}

const handleFetchCasaPrefill = async (otpValResponse, globals) => {
  const otpValCasaRes = otpValResponse;
  currentFormContext.fetchCasaResponse = otpValResponse;
  const selectAcct = globals.form.fdDetailsWrapper.externalFundingWizardView.wizardExternalFunding.selectAccount;
  const custmerCasa = otpValCasaRes?.casaDetails?.customerCASADetailsDTO?.[0];
  const custNameField = formUtil(globals, selectAcct.customerName);
  custNameField.setValue(`Hey, ${custmerCasa?.customerFullName}`);
  await updateFundAct(custmerCasa.casaAccountDetails, 0, selectAcct.multipleAccounts.multipleAccountRepeatable.$qualifiedName, globals);
};

export {
  updateFundAct,
  updateReviewPage,
  getAcctPanelData,
  handleFetchCasaPrefill,
};
