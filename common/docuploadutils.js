/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import corpCreditCard from './constants.js';
import { corpCreditCardContext } from './journey-utils.js';
import {
  displayLoader,
  hideLoaderGif,
  chainedFetchAsyncCall,
} from './makeRestAPI.js';
import { urlPath, generateUUID } from './formutils.js';

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
    throw new Error('Failed to create document payload', error);
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
    displayLoader();
    const fsFilePayload = await createDocPayload(frontDoc);
    const bsFilePayload = await createDocPayload(backDoc);
    if (fsFilePayload && bsFilePayload) {
      const [fsFileResponse, bsFileResponse] = await chainedFetchAsyncCall(
        apiEndPoint,
        method,
        [fsFilePayload, bsFilePayload],
        'formData',
      );
      console.log(fsFileResponse, 'fs-file-1-response');
      console.log(bsFileResponse, 'bs-file-1-response');
      hideLoaderGif();
    } else {
      throw new Error('missing payload');
    }
  } catch (error) {
    hideLoaderGif();
    console.log('errorInFilePayload');
  }
};

export default documentUpload;
