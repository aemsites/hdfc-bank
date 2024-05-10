/* eslint-disable no-undef */
import { currentFormContext } from './journey-utils.js';

/**
 * @name setPageDetails
 * @param {string} pageName - pageName is the step-screen where user CTA happened
 */
function setPageDetails(pageName) {
  digitalData = {
    form: {
      name: currentFormContext.formName,
    },
    page: {
      pageInfo: {
        pageName,
        errorMessage: currentFormContext.errorMsg,
        errorCode: currentFormContext.errorcode,
        errorAPI: currentFormContext.lastAPICalled,
      },
    },
    user: {},
    link: {},
    event: {},
    loan: {},
    assisted: {},
    offer: {
      eligibleOffers: currentFormContext.eligibleOffers,
    },
  };

  try {
    _satellite.track('pageload');
  } catch (err) { /* empty */ }
}

// eslint-disable-next-line import/prefer-default-export
export { setPageDetails };
