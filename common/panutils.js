import { currentFormContext } from './journey-utils.js';
import corpCreditCard from './constants.js';

const { deadPanStatus } = corpCreditCard;
const executeCheck = (panStatus, terminationCheck, callback, globals) => {
  currentFormContext.apsPanChkFlag = panStatus === 'E' ? 'N' : 'Y';
  switch (currentFormContext.journeyType) {
    case 'ETB':
      if (!terminationCheck) {
        callback.executeInterfaceApi(globals);
      } else if (panStatus === 'E') {
        callback.executeInterfaceApi(globals);
      } else if (deadPanStatus.includes(panStatus)) {
        callback.terminateJourney(panStatus, globals);
      } else {
        currentFormContext.apsPanChkFlag = 'Y';
        callback.executeInterfaceApi(globals);
      }
      break;
    case 'NTB':
      if (panStatus === 'E') {
        callback.executeInterfaceApi(globals);
      } else if (deadPanStatus.includes(panStatus)) {
        callback.terminateJourney(panStatus, globals);
      } else {
        callback.restartJourney(panStatus, globals);
      }
      break;
    default:
      callback.restartJourney(panStatus, globals);
  }
};

export default executeCheck;
