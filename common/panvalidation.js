import { restAPICall } from './makeRestAPI.js';
import { urlPath } from './formutils.js';

const containsValue = (data) => typeof data !== 'undefined' && data !== null && data !== '';

const isReferenceOfTypeFunction = (methodReference) => typeof methodReference === 'function';

const checkPanDobFormat = (dob) => {
  const pattern = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;
  return pattern.test(dob);
};

const isPanObjRequestProcessable = (panObj) => {
  if (
    containsValue(panObj.panNumber)
    && containsValue(panObj.panType)
    && panObj.dob === undefined
  ) { // Optional
    return true;
  }
  if (
    containsValue(panObj.panNumber)
    && containsValue(panObj.panType)
    && panObj.dob !== undefined
    && checkPanDobFormat(panObj.dob)
  ) {
    return true;
  }
  return false;
};

const isNameMatchObjRequestProcessable = (nameMatchObj) => (
  containsValue(nameMatchObj.srcName) && containsValue(nameMatchObj.trgName)
);

const isRequestProcessable = (reqObj) => (
  typeof reqObj !== 'undefined'
  && containsValue(reqObj.mobileNumber)
  && containsValue(reqObj.journeyID)
  && containsValue(reqObj.journeyName)
  && (
    (reqObj.panInfo !== undefined && isPanObjRequestProcessable(reqObj.panInfo))
    || (reqObj.nameInfo !== undefined && isNameMatchObjRequestProcessable(reqObj.nameInfo))
  )
);

const isEventHandlerProcessable = (eventHandlers) => (
  typeof eventHandlers !== 'undefined'
  && eventHandlers !== null
  && isReferenceOfTypeFunction(eventHandlers.successCallBack)
  && isReferenceOfTypeFunction(eventHandlers.failureCallBack)
);
const PANValidationAndNameMatchService = (reqPayload, eventHandlers) => {
  try {
    const apiEndPoint = urlPath('/content/hdfc_forms_common_v2/api/panValNameMatch.json');

    if (isRequestProcessable(reqPayload) && isEventHandlerProcessable(eventHandlers)) {
      restAPICall('', 'POST', reqPayload, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack, 'Loading');
    }
    throw new Error('argument error');
  } catch (e) {
    const errorObj = {
      value: e,
      status: false,
    };
    return errorObj;
  }
};

export default PANValidationAndNameMatchService;
