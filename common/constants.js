const corpCreditCard = {
  endpoints: {
    aadharCallback: '/content/hdfc_etb_wo_pacc/api/aadharCallback.json',
    aadharInit: '/content/hdfc_haf/api/aadhaarInit.json',
    fetchAuthCode: '/content/hdfc_commonforms/api/fetchauthcode.json',
    emailId: '/content/hdfc_commonforms/api/emailid.json',
    executeInterface: '/content/hdfc_haf/api/executeinterface.json',
    finalDap: '/content/hdfc_etb_wo_pacc/api/finaldap.json',
    ipa: '/content/hdfc_haf/api/ipa.json',
    journeyDropOff: '/content/hdfc_commonforms/api/journeydropoff.json',
    journeyDropOffParam: '/content/hdfc_commonforms/api/journeydropoffparam.json',
    journeyDropOffUpdate: '/content/hdfc_commonforms/api/journeydropoffupdate.json',
    otpGen: '/content/hdfc_haf/api/otpgenerationccV4.json',
    otpValFetchAssetDemog: '/content/hdfc_haf/api/otpvaldemogV4.json',
    panValNameMatch: '/content/hdfc_forms_common_v2/api/panValNameMatch.json',
    docUpload: '/content/hdfc_etb_wo_pacc/api/documentUpload.json',
  },
  idCom: {
    productCode: 'CORPCC',
    scopeMap: {
      only_casa: {
        no: 'AACC',
        yes: 'ADOBE_PACC',
      },
      casa_asset: {
        no: 'AACC',
        yes: 'ADOBE_PACC',
      },
      casa_cc: 'PADC',
      only_cc: 'OYCC',
    },
  },
  baseUrl: 'https://applyonlinedev.hdfcbank.com',
  journeyName: 'CORPORATE_CARD_JOURNEY',
  channel: 'ADOBE_WEBFORMS',
  deadPanStatus: ['D', 'ED', 'X', 'F'],
};

export default corpCreditCard;
