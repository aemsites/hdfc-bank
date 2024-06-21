/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import corpCreditCard from './constants.js';
import { corpCreditCardContext } from './journey-utils.js';
import {
  displayLoader,
  getJsonResponse,
  hideLoaderGif,
  restAPICall,
} from './makeRestAPI.js';

/**
 * Convert file into binary
 * @param {object} data - fileObject
 * @returns {BinaryData} - binary formated data
 */
const binaryFormat = (data) => {
  const file = new FileReader();
  file.readAsText(data);
  return file.result;
};

/**
 * Uploads multiple files asynchronously and returns an array of responses.
 * @param {Array} uploadFiles - Array of files to upload.
 * @param {string} apiUrl - The API endpoint URL for file upload.
 * @param {string} method - The HTTP method ('GET', 'POST', etc.) for the API request.
 * @returns {Promise<Array>} - Promise that resolves to an array of responses from each file upload.
 */
const uploadMultipleFileCall = (uploadFiles, apiUrl, method) => {
  displayLoader();
  const fileResponse = [];
  uploadFiles?.forEach(async (payloadData, i) => {
    try {
      const response = await getJsonResponse(apiUrl, payloadData, method);
      fileResponse[i] = response;
    } catch (error) {
      hideLoaderGif();
      fileResponse[i] = error;
    }
  });
  return fileResponse;
};

const createDocPayload = ({
  docValue,
  docType,
  fileId,
  globals,
}) => {
  const file = docValue?.$value?.data;
  const fileBinaryFormat = binaryFormat(file);
  debugger;
  const { currentFormContext } = corpCreditCardContext;
  const { breDemogResponse } = currentFormContext; // requestNumber
  const executeInterfaceRes = currentFormContext.executeInterfaceResPayload; // applicationRefNo
  const { journeyID } = currentFormContext;
  const { requestNumber } = breDemogResponse;
  const { applicationRefNo } = executeInterfaceRes;
  const { journeyName } = corpCreditCard;
  const mobileNumber = globals.form.loginPanel.mobilePanel.registeredMobileNumber.$value;
  const { userAgent } = window.navigator;
  const documentName = file.data.name;
  const formData = new FormData();
  formData.append('548be82c-a968-467c-8e35-7db7610dffca', fileBinaryFormat); // idKey-?
  formData.append('imageBinary', fileBinaryFormat);
  formData.append('documentType', docType);
  formData.append('journeyID', journeyID);
  formData.append('requestNumber', requestNumber);
  formData.append('applicationRefNo', applicationRefNo);
  formData.append('journeyName', journeyName);
  formData.append('mobileNumber', mobileNumber);
  formData.append('userAgent', userAgent);
  formData.append('documentName', documentName);
  formData.append('548be82c-a968-467c-8e35-7db7610dffca', fileBinaryFormat); // idKey-?
  formData.append(fileId, fileBinaryFormat); // idKey-? is it '1_FS' or '2_BS'
  formData.append(`existing_${fileId}`, ''); // idKey-? is it '1_FS' or '2_BS'
  return formData;
};

/**
 * documentUpload
 * @param {object} globals - The global object containing necessary globals form data
 */
const documentUpload = async (globals) => {
  debugger;
  // form.corporateCardWizardView.selectKycPanel.docUploadETBFlow.DocUploadBack
  // const frontFile = globals.form.corporateCardWizardView.selectKycPanel.docUploadETBFlow.DocUploadFront.$value;
  // const backFile = globals.form.corporateCardWizardView.selectKycPanel.docUploadETBFlow.DocUploadBack.$value;
  // const documentType = globals.form.corporateCardWizardView.selectKycPanel.docUploadETBFlow.docUploadDropdown.$value;
  const fsId = '1_FS';
  const bsId = '1_BS';
  const { selectKycPanel: { docUploadETBFlow: { DocUploadFront, DocUploadBack, docUploadDropdown } } } = globals.form.corporateCardWizardView;
  const docType = docUploadDropdown.$value;
  const frontDoc = {
    DocUploadFront,
    docType,
    fsId,
    globals,
  };
  const backDoc = {
    DocUploadBack,
    docType,
    bsId,
    globals,
  };
  const fsFilePayload = createDocPayload(frontDoc);
  const bsFilePayload = createDocPayload(backDoc);
  const apiEndPoint = corpCreditCard.endpoints.docUpload;
  const method = 'POST';
  const eventHandlers = {
    successCallBack(res, globalObj) {
      debugger;
      console.log(res, globalObj);
    },
    errorCallBack(res, globalObj) {
      debugger;
      console.log(res, globalObj);
    },
  };
  restAPICall(globals, 'POST', fsFilePayload, apiEndPoint, eventHandlers.successCallBack, eventHandlers.errorCallBack);

  // need to use 👇 further for multiple file api handling and after effect methods.
  try {
    const [fsFileRes, bsFileRes] = await uploadMultipleFileCall([fsFilePayload, bsFilePayload], apiEndPoint, method);
  } catch (error) {
    console.log(error);
  }
};

export default documentUpload;
