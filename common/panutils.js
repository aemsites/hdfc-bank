const DEAD_PAN_STATUS = ['D', 'X', 'F', 'ED'];
const executeCheck = (journeyType, panStatus, terminationCheck, callback) => {
  switch (journeyType) {
    case 'ETB':
      if (!terminationCheck) {
        const apsPanChkFlag = panStatus === 'E' ? undefined : 'Y';
        callback.executeInterfaceApi(apsPanChkFlag);
      } else if (panStatus === 'E') {
        callback.executeInterfaceApi();
      } else if (DEAD_PAN_STATUS.includes(panStatus)) {
        callback.terminateJourney(panStatus);
      } else {
        const apsPanChkFlag = 'Y';
        callback.executeInterfaceApi(apsPanChkFlag);
      }
      break;
    case 'NTB':
      if (panStatus === 'E') {
        callback.executeInterfaceApi();
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
