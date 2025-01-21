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
  getAcctPanelData,
  handleFetchCasaPrefill,
};
