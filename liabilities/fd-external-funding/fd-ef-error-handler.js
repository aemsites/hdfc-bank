
import * as FD_EF_CONSTANT from './constant.js';
import { displayLoader, hideLoaderGif } from '../../common/makeRestAPI.js';
import {
  invokeJourneyDropOff,
  invokeJourneyDropOffUpdate,
  effdInvokeJourneyDropOffByParam,
} from './fd-external-funding-journey-utils.js';
const {
  CURRENT_FORM_CONTEXT: currentFormContext,
} = FD_EF_CONSTANT;
function errorHandlingFDExt(response, globals) {
    hideLoaderGif();
    const {
      mobileNumber,
      journeyID,
    } = currentFormContext;
    if (response.errorCode === '02') {
      globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.incorrectOTPText, { visible: true });
    } else if (response?.status?.errorCode === 'AD_SSV999') {
      const {bannerImagePanel} = globals.form;
      globals.functions.setProperty(bannerImagePanel, { visible: false });
      globals.functions.setProperty(globals.form.thankYouPanel, { visible: false });
      globals.functions.setProperty(globals.form.resultPanel, { visible: true });
      globals.functions.setProperty(globals.form.resultPanel.commonErrorPanel, { visible: true });
    }
    
    invokeJourneyDropOffUpdate(journeyState, mobileNumber, journeyID, globals);
  }

  export {
    // eslint-disable-next-line import/prefer-default-export
    errorHandlingFDExt,
  };