import { CURRENT_FORM_CONTEXT } from '../../common/constants.js';
import { getUrlParamCaseInsensitive } from '../../common/formutils.js';
import { IPA_RESPONSE } from './ipautil.js';

const confirmCardState = {
  selectedCardIndex: -1,
  knowMoreClickedIndex: -1,
};

/**
 *
 * @name confirmCardClickHandler
 * @param {Object} globals - The global context object containing various information.
 */
const confirmCardClickHandler = (globals) => {
  CURRENT_FORM_CONTEXT.customerIdentityChange = true;
  CURRENT_FORM_CONTEXT.selectedProductCode = IPA_RESPONSE?.productDetails?.[confirmCardState.selectedCardIndex]?.cardProductCode || 'FCFL';
  const { fdBasedCreditCardWizard, docUploadFlow } = globals.form;
  const { addressDetails, employeeAssistance } = fdBasedCreditCardWizard.basicDetails.reviewDetailsView;
  const { aadharBiometricVerification } = globals.form.selectKYCOptionsPanel.selectKYCMethodOption1;
  const inPersonBioKYC = getUrlParamCaseInsensitive('InpersonBioKYC') || '';
  if ((addressDetails.mailingAddressToggle._data.$_value === 'off' || inPersonBioKYC.toLowerCase() === 'yes')
  && employeeAssistance.inPersonBioKYCPanel.inPersonBioKYCOptions._data.$_value === '0') {
    globals.functions.setProperty(aadharBiometricVerification, { value: '0' });
  } else if (addressDetails.mailingAddressToggle._data.$_value === 'on' && CURRENT_FORM_CONTEXT.customerIdentityChange) {
    globals.functions.setProperty(docUploadFlow, { visible: true });
    globals.functions.setProperty(docUploadFlow.uploadAddressProof, { visible: true });
    globals.functions.setProperty(docUploadFlow.docUploadPanel, { visible: false });
    globals.functions.setProperty(fdBasedCreditCardWizard, { visible: false });
    CURRENT_FORM_CONTEXT.addressDocUploadFlag = true;
  } else if (addressDetails.mailingAddressToggle._data.$_value === 'on' && !CURRENT_FORM_CONTEXT.customerIdentityChange) {
    // call idcomm();
  } else if (addressDetails.mailingAddressToggle._data.$_value === 'off' && !CURRENT_FORM_CONTEXT.customerIdentityChange) {
    // show select kyc screen
  } else if (addressDetails.mailingAddressToggle._data.$_value === 'off' && CURRENT_FORM_CONTEXT.customerIdentityChange) {
    // show select kyc screen
  }
};

const setknowMoreBenefitsPanelData = (moreFeatures, knowMoreBenefitsPanel, globals) => {
  if (!moreFeatures?.length) return;
  const transformedMoreFeatures = moreFeatures.map((feature) => ({
    cardBenefitsText: feature,
  }));
  globals.functions.importData({ items: transformedMoreFeatures }, knowMoreBenefitsPanel.$qualifiedName);
};

const knowMoreCardClickHandler = (globals) => {
  const { knowMoreBenefitsPanel } = globals.form.fdBasedCreditCardWizard.selectCard.knowMorePopupWrapper.viewAllCardBenefitsPanel;
  const { knowMorePopupWrapper } = globals.form.fdBasedCreditCardWizard.selectCard;

  confirmCardState.knowMoreClickedIndex = (IPA_RESPONSE?.productDetails?.length > 1) ? globals.field.$parent.$index : 0;
  const moreFeatures = IPA_RESPONSE?.productDetails?.[confirmCardState.knowMoreClickedIndex]?.features;
  setknowMoreBenefitsPanelData(moreFeatures, knowMoreBenefitsPanel, globals);

  globals.functions.setProperty(knowMorePopupWrapper, { visible: true });
};

const selectCardBackClickHandler = (globals) => {
  const { selectCardFaciaPanelMultiple } = globals.form.fdBasedCreditCardWizard.selectCard;
  confirmCardState.selectedCardIndex = -1;
  if (IPA_RESPONSE.productDetails.length > 1) {
    IPA_RESPONSE.productDetails.slice(0, -1).forEach(() => {
      globals.functions.dispatchEvent(selectCardFaciaPanelMultiple, 'removeItem');
    });
    globals.functions.setProperty(selectCardFaciaPanelMultiple[0].cardSelection, { value: undefined });
  }
};

const cardSelectHandler = (cardsPanel, globals) => {
  if (confirmCardState.selectedCardIndex !== -1) {
    globals.functions.setProperty(cardsPanel[confirmCardState.selectedCardIndex].cardSelection, { value: undefined });
    setTimeout(() => {
      confirmCardState.selectedCardIndex = cardsPanel.findIndex((item) => item.cardSelection._data.$value === '0');
    }, 50);
  } else {
    confirmCardState.selectedCardIndex = cardsPanel.findIndex((item) => item.cardSelection._data.$value === '0');
  }
};

const popupBackClickHandler = (globals) => {
  const { knowMoreBenefitsPanel } = globals.form.fdBasedCreditCardWizard.selectCard.knowMorePopupWrapper.viewAllCardBenefitsPanel;
  const { knowMorePopupWrapper } = globals.form.fdBasedCreditCardWizard.selectCard;
  globals.functions.setProperty(knowMorePopupWrapper, { visible: false });
  if (confirmCardState.knowMoreClickedIndex !== -1) {
    IPA_RESPONSE.productDetails?.[confirmCardState.knowMoreClickedIndex]?.features.slice(0, -1).forEach(() => {
      globals.functions.dispatchEvent(knowMoreBenefitsPanel, 'removeItem');
    });
  }
};

export {
  knowMoreCardClickHandler,
  confirmCardClickHandler,
  selectCardBackClickHandler,
  cardSelectHandler,
  popupBackClickHandler,
};