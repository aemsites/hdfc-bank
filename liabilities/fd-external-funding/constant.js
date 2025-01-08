import { getSubmitBaseUrl } from '../../blocks/form/constant.js';

const JOURNEY_NAME = 'FD_EXTERNAL_FUNDING';
const JOURNEY_ABBR_VALUE = 'FD_E_F';
const CURRENT_FORM_CONTEXT = {};
const BASE_URL = getSubmitBaseUrl();
const END_POINTS = {
  otpGen: `${BASE_URL}/content/hdfc_fdforms/api/customeridentificationotpgen.json`,
};

export {
  JOURNEY_NAME,
  CURRENT_FORM_CONTEXT,
  JOURNEY_ABBR_VALUE,
  END_POINTS,
};
