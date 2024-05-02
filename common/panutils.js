import { currentFormContext } from './journey-utils.js';

const DEAD_PAN_STATUS = ['D', 'X', 'F', 'ED'];
const executeCheck = (panStatus, terminationCheck, callback, globals, breDemogResponse) => {
  let apsPanChkFlag = panStatus === 'E' ? 'N' : 'Y';
  switch (currentFormContext.journeyType) {
    case 'ETB':
      if (!terminationCheck) {
        callback.executeInterfaceApi(apsPanChkFlag, globals, breDemogResponse);
      } else if (panStatus === 'E') {
        callback.executeInterfaceApi(apsPanChkFlag, globals, breDemogResponse);
      } else if (DEAD_PAN_STATUS.includes(panStatus)) {
        callback.terminateJourney(panStatus, globals);
      } else {
        apsPanChkFlag = 'Y';
        callback.executeInterfaceApi(apsPanChkFlag, globals, breDemogResponse);
      }
      break;
    case 'NTB':
      if (panStatus === 'E') {
        callback.executeInterfaceApi(apsPanChkFlag, globals, breDemogResponse);
      } else if (DEAD_PAN_STATUS.includes(panStatus)) {
        callback.terminateJourney(panStatus, globals);
      } else {
        callback.restartJourney(panStatus);
      }
      break;
    default:
      callback.restartJourney(panStatus);
  }
};

export default executeCheck;
