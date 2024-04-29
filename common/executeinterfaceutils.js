/* eslint-disable no-console */
const customerValidationHandler = {
  executeInterfaceApi: (APS_PAN_CHK_FLAG) => {
    console.log(`APS_PAN_CHK_FLAG: ${APS_PAN_CHK_FLAG} and called executeInterfaceApi()`);
  },

  terminateJourney: (panStatus) => {
    console.log(`pan Status: ${panStatus} and called terminateJourney()`);
  },

  restartJourney: (panStatus) => {
    console.log(`pan Status: ${panStatus} and called restartJourney()`);
  },
};

export default customerValidationHandler;
