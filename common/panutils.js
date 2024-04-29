const DEAD_PAN_STATUS = ['D', 'X', 'F', 'ED'];
const executeCheck = (journeyType, panStatus, terminationCheck, callback, globals, breDemogResponse, currentFormContext, JWT_TOKEN) => {
  let apsPanChkFlag = panStatus === 'E' ? 'N' : 'Y';
  switch (journeyType) {
    case 'ETB':
      if (!terminationCheck) {
        callback.executeInterfaceApi(apsPanChkFlag, globals, journeyType, breDemogResponse, currentFormContext, JWT_TOKEN);
      } else if (panStatus === 'E') {
        callback.executeInterfaceApi(apsPanChkFlag, globals, journeyType, breDemogResponse, currentFormContext, JWT_TOKEN);
      } else if (DEAD_PAN_STATUS.includes(panStatus)) {
        callback.terminateJourney(panStatus);
      } else {
        apsPanChkFlag = 'Y';
        callback.executeInterfaceApi(apsPanChkFlag, globals, journeyType, breDemogResponse, currentFormContext, JWT_TOKEN);
      }
      break;
    case 'NTB':
      if (panStatus === 'E') {
        callback.executeInterfaceApi(apsPanChkFlag, globals, journeyType, breDemogResponse, currentFormContext, JWT_TOKEN);
      } else if (DEAD_PAN_STATUS.includes(panStatus)) {
        callback.terminateJourney(panStatus);
      } else {
        callback.restartJourney(panStatus);
      }
      break;
    default:
      callback.restartJourney(panStatus);
  }
};

export default executeCheck;
