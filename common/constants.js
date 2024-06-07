const corpCreditCard = {
  endpoints: {
    aadharCallback: '/content/hdfc_etb_wo_pacc/api/aadharCallback.json',
    aadharInit: '/content/hdfc_etb_wo_pacc/api/aadharInit.json',
    authCode: '/content/hdfc_commonforms/api/fetchauthcode.json',
    emailId: '/content/hdfc_commonforms/api/emailid.json',
    executeInterface: '/content/hdfc_haf/api/executeinterface.json',
    finalDapAndPdfGen: '/content/hdfc_ccforms/api/pacc/finaldapandpdfgen.json',
    ipa: '/content/hdfc_etb_wo_pacc/api/ipa.json',
    journeyDropOff: '/content/hdfc_commonforms/api/journeydropoff.json',
    journeyDropOffParam: '/content/hdfc_commonforms/api/journeydropoffparam.json',
    journeyDropOffUpdate: '/content/hdfc_commonforms/api/journeydropoffupdate.json',
    otpGen: '/content/hdfc_haf/api/otpgenerationccV4.json',
    otpValFetchAssetDemog: '/content/hdfc_cc_unified/api/otpValFetchAssetDemog.json',
    panValNameMatch: '/content/hdfc_forms_common_v2/api/panValNameMatch.json',
  },
  baseUrl: 'https://applyonlinedev.hdfcbank.com',
  journeyName: 'CORPORATE_CARD_JOURNEY',
  channel: 'ADOBE_WEBFORMS',
  deadPanStatus: ['D', 'ED', 'X', 'F'],
};

export default corpCreditCard;
