/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import corpCreditCard from './constants.js';
import { corpCreditCardContext } from './journey-utils.js';
import {
  displayLoader,
  hideLoaderGif,
} from './makeRestAPI.js';
import { urlPath, generateUUID } from './formutils.js';

/**
 * Uploads multiple files asynchronously and returns an array of responses.
 * @param {Array} uploadFiles - Array of files to upload.
 * @param {string} apiUrl - The API endpoint URL for file upload.
 * @param {string} method - The HTTP method ('GET', 'POST', etc.) for the API request.
 * @returns {Promise<Array>} - Promise that resolves to an array of responses from each file upload.
 */
const uploadMultipleFileCall = async (uploadFiles, apiUrl, method) => {
  displayLoader();
  const promises = uploadFiles?.map(async (formData) => {
    try {
      const response = await fetch(apiUrl, {
        method,
        body: formData,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return error;
    }
  });
  const fileResponses = await Promise.allSettled(promises);
  hideLoaderGif();
  return fileResponses;
};

/**
 * Creates a FormData payload for document upload.
 *
 * @param {Object} param0 - Parameters object.
 * @param {Object} param0.docValue - Document value object containing data to upload.
 * @param {string} param0.docType - Type of the document.
 * @param {string} param0.fileId - Unique identifier for the file.
 * @returns {Promise<FormData>} FormData object containing the document payload.
 * @throws {Error} Throws an error if document creation fails.
 */
const createDocPayload = async ({ docValue, docType, fileId }) => {
  try {
    const {
      currentFormContext: {
        journeyName,
        journeyID,
        eRefNumber,
        breDemogResponse: { MOBILE },
        executeInterfaceResPayload: { applicationRefNumber },
      },
    } = corpCreditCardContext;
    const file = docValue?.$value?.data;
    const fileBinary = file;
    const documentName = file.name;
    const mobileNumber = String(MOBILE);
    const { userAgent } = window.navigator;
    const uuId = generateUUID();
    const payloadKeyValuePairs = {
      [`${uuId}`]: fileBinary,
      imageBinary: fileBinary,
      docuemntType: docType,
      journeyID,
      requestNumber: eRefNumber,
      applicationRefNo: applicationRefNumber,
      journeyName,
      mobileNumber,
      userAgent,
      docuemntName: documentName,
      fileId: uuId,
      [`existing_${fileId}`]: '',
    };
    const formData = new FormData();
    Object.entries(payloadKeyValuePairs).forEach(([key, value]) => formData.append(key?.toString(), value));
    return formData;
  } catch (error) {
    throw new Error('Failed to create document payload');
  }
};

/**
 * documentUpload
 * @param {object} globals - The global object containing necessary globals form data
 */
const documentUpload = async (globals) => {
  const fsId = '1_FS';
  const bsId = '1_BS';
  const {
    selectKycPanel: {
      docUploadETBFlow: { DocUploadFront, DocUploadBack, docUploadDropdown },
    },
  } = globals.form.corporateCardWizardView;
  const docType = docUploadDropdown.$value;
  const frontDoc = {
    docValue: DocUploadFront,
    docType,
    fileId: fsId,
  };
  const backDoc = {
    docValue: DocUploadBack,
    docType,
    fileId: bsId,
  };
  const apiEndPoint = urlPath(corpCreditCard.endpoints.docUpload);
  const method = 'POST';
  try {
    const fsFilePayload = await createDocPayload(frontDoc);
    const bsFilePayload = await createDocPayload(backDoc);
    const [fsFileResponse, bsFileResponse] = await uploadMultipleFileCall(
      [fsFilePayload, bsFilePayload],
      apiEndPoint,
      method,
    );
    console.log(fsFileResponse, 'fs-file-1-response');
    console.log(bsFileResponse, 'bs-file-1-response');
  } catch (error) {
    console.log('errorInFilePayload');
  }
};

export default documentUpload;
