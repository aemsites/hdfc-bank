
import * as FD_EF_CONSTANT from './constant.js';
import { displayLoader, hideLoaderGif } from '../../common/makeRestAPI.js';
const {
  CURRENT_FORM_CONTEXT: currentFormContext,
} = FD_EF_CONSTANT;
function errorHandlingFDExt(response, journeyState, globals) {
    hideLoaderGif();
    const {
      mobileNumber,
      journeyID,
    } = currentFormContext;
    if (response.errorCode === '02') {
      globals.functions.setProperty(globals.form.otppanelwrapper.otpFragment.incorrectOTPText, { visible: true });
    }  
    invokeJourneyDropOffUpdate(journeyState, mobileNumber, journeyID, globals);
  }

  export {
    // eslint-disable-next-line import/prefer-default-export
    errorHandlingFDExt,
  };