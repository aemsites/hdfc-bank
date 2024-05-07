import {
  displayLoader, getJsonResponse, hideLoader,
} from './makeRestAPI.js';
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

const isRequestProcessable = (reqObj) => (
  typeof reqObj !== 'undefined'
  && containsValue(reqObj.mobileNumber)
  && containsValue(reqObj.journeyID)
  && containsValue(reqObj.journeyName)
  && (
    (reqObj.panInfo !== undefined && isPanObjRequestProcessable(reqObj.panInfo))
  )
);

const isEventHandlerProcessable = (eventHandlers) => (
  typeof eventHandlers !== 'undefined'
  && eventHandlers !== null
  && isReferenceOfTypeFunction(eventHandlers.successCallBack)
  && isReferenceOfTypeFunction(eventHandlers.errorCallBack)
);
const PANValidationAndNameMatchService = async (reqPayload, eventHandlers) => {
  displayLoader('Please wait while we check your offer...');
  const successMethod = (respData) => {
    eventHandlers.successCallBack(respData);
  };
  const errorMethod = (errorData) => {
    hideLoader();
    eventHandlers.errorCallBack(errorData);
  };
  try {
    const apiEndPoint = urlPath('/content/hdfc_forms_common_v2/api/panValNameMatch.json');
    const method = 'POST';
    if (isRequestProcessable(reqPayload) && isEventHandlerProcessable(eventHandlers)) {
      const response = await getJsonResponse(apiEndPoint, reqPayload, method);
      return successMethod(response);
    }
    const errStack = 'argument error';
    throw errStack;
  } catch (e) {
    return errorMethod(e);
  }
};

export default PANValidationAndNameMatchService;
