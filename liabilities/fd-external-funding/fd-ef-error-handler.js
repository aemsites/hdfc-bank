
import * as FD_EF_CONSTANT from './constant.js';
const {
  CURRENT_FORM_CONTEXT: currentFormContext,
} = FD_EF_CONSTANT;
function errorHandlingFDExt(response, journeyState, globals) {
    const {
      mobileNumber,
      journeyID,
    } = currentFormContext;
    if (response.errorCode === '02') {
    }  
    invokeJourneyDropOffUpdate(journeyState, mobileNumber, journeyID, globals);
  }

  export {
    // eslint-disable-next-line import/prefer-default-export
    errorHandlingFDExt,
  };