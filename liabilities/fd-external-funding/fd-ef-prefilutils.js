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
    return ({
      accountRadio, accountNumber, availableBalance, accountType,
    });
  });
};

const updateFundAct = async (casaAcctDetails, selectedRadioBtnIndex, multipleAcctQName, globals) => {
  const acctDetailsArrObj = casaAcctDetails || [];
  const pannelData = await getAcctPanelData(acctDetailsArrObj) || [];
  const acctData = pannelData?.map((rBtn, i) => ({ ...rBtn, accountRadio: (i === selectedRadioBtnIndex) ? '0' : undefined }));
  globals.functions.importData(acctData, multipleAcctQName);
};

const handleFetchCasaPrefill = async (globals) => {
  const otpValCasaRes = DATA_CONTRACT.otpValResponse;
  currentFormContext.fetchCasaResponse = DATA_CONTRACT.otpValResponse;
  const selectAcct = globals.form.wizardWrapper.wizardExternalFunding.selectAccount;
  const custmerCasa = otpValCasaRes?.casaDetails?.customerCASADetailsDTO?.[0];
  const custNameField = formUtil(globals, selectAcct.customerName);
  custNameField.setValue(custmerCasa?.customerFullName);
  await updateFundAct(custmerCasa.casaAccountDetails, 0, selectAcct.multipleAccounts.multipleAccountRepeatable.$qualifiedName, globals);
};

export {
  updateFundAct,
  getAcctPanelData,
  handleFetchCasaPrefill,
};
