import { getSubmitBaseUrl } from '../../blocks/form/constant.js';
import { CURRENT_FORM_CONTEXT } from '../../common/constants.js';

const JOURNEY_NAME = 'FD_EXTERNAL_FUNDING';
const JOURNEY_ABBR_VALUE = 'FD_E_F';
const BASE_URL = getSubmitBaseUrl();
const END_POINTS = {
  otpGen: `${BASE_URL}/content/hdfc_fdforms/api/customeridentificationotpgen.json`,
  fdSimulation: `${BASE_URL}/content/hdfc_fdforms/api/fdsimulation.json`,
};
const DATA_LIMITS = {
  minInvest: 5000,
};

const INR_CONST = {
  nfObject: new Intl.NumberFormat('hi-IN'),
  rsUnicode: '\u20B9',
};

const DATA_CONTRACT = {
  otpValResponse: {
    casaDetails: {
      customerCASADetailsDTO: [
        {
          customerFullName: 'Ranjit Vijay Patil',
          datIncorporated: null,
          rmCode: null,
          rmGroup: null,
          rMPhoneArea: null,
          customerEmailId: 'ranjit.patil@hdfcbank.com',
          customerTypeDesc: 'INDIVIDUALS',
          rMPhoneExtn: null,
          rmBranchCity: null,
          mobileNumber: '918619484593',
          customerGender: 'M',
          rmBranchCode: null,
          dateOfBirth: '19920910',
          rmEmpName: null,
          existingCustomer: 'Y',
          ethnicCodeDesc: 'OTHER 12',
          customerType: 'I  ',
          rmEmailID: null,
          panNoAvailable: 'Y',
          customerId: 900296915,
          rmBranchName: null,
          casaAccountDetails: [
            {
              nomineeAvailable: 'N',
              custAcctRel: 'SOW',
              accountType: 'RESIDENT',
              nomineeName: null,
              accountNumber: 'XXXXXXXXXX4042',
              datAcctOpen: '20220412',
              productName: 'SAVINGS A/C - RESIDENTS100',
              flgNomineeNameDisplay: null,
              accountStatus: '8',
              branchCode: '2373',
              clearBalance: 22474.99,
              productCode: 100,
              nomineeDOB: null,
              productType: 'SAVING',
              acctBranchName: 'MEMARI ANKAR-SUNDER NIWAS-HOSHIARP ',
            },
            {
              nomineeAvailable: 'N',
              custAcctRel: 'SOW',
              accountType: 'RESIDENT',
              nomineeName: null,
              accountNumber: 'XXXXXXXXXX9942',
              datAcctOpen: '20220412',
              productName: 'SAVINGS A/C - RESIDENTS100',
              flgNomineeNameDisplay: null,
              accountStatus: '8',
              branchCode: '2373',
              clearBalance: 32474.99,
              productCode: 100,
              nomineeDOB: null,
              productType: 'CURRENT',
              acctBranchName: 'MEMARI ANKAR-SUNDER NIWAS-HOSHIARP ',
            },
          ],
          rMPhoneCountry: null,
          ethnicCode: '0  ',
        },
      ],
      status: {
        statusCode: '00',
        errorMsg: 'Success',
      },
    },
    pseudoID: 'abcd',
    additionalInfo: {
      longTermFDMinAmount: 5000,
      defaultShortTermFDAmount: 5000,
      shortTermFDMaxAmount: 49999,
      defaultShortTermFDTenure: 120,
      shortTermFDMinAmount: 5000,
      tenures: [
        7,
        15,
        30,
        46,
        61,
        91,
        181,
        271,
        271,
        361,
        721,
        1081,
        1801,
        3600,
      ],
      defaultLongTermFDAmount: 5000,
      defaultLongTermFDTenure: 1801,
      longTermFDMaxAmount: 49999999,
      maxFDBookingLimitWithoutConsent: 19999999,
    },
    panOperativeDateFlag: false,
    otpValidation: {
      status: {
        statusCode: '00',
        errorMsg: 'Success',
      },
    },
  },
  // simulation response
  fdSimResponse: {
    tdSimulationResponse: {
      interestRate: 12.5,
      maturityAmount: {
        amount: 9173,
        currencyCode: 'INR',
      },
      depositOpeningValueDate: {
        dateString: '20250109000000',
      },
      stepUpOffer: false,
      maturityDate: {
        dateString: '20300110000000',
      },
    },
    status: {
      errorCode: '0',
      errorMsg: 'Success',
    },
  },
  fdSimReques: {
    RequestPayload: {
      SimulateTermDepositRequest: {
        mobileNo: '918619484593',
        operationMode: '5',
        tdSimulationRequestDTO: {
          termDepositFactsDTO: {
            debitAccountNo: 'XXXXXXXXXX4042',
            productGroup: 'Reinvestment',
            principalAmount: {
              amount: '5000',
              currencyCode: 'INR',
            },
            term: {
              days: '1',
              months: '60',
            },
            dictionaryArray: [
              {
                nameValuePairDTOArray: [
                  {
                    name: 'codTypTd',
                    value: 'C',
                  },
                ],
              },
            ],
          },
        },
        dictionaryArray: [
          {
            nameValuePairDTOArray: [
              {
                name: 'DOB',
                value: '19920910',
              },
              {
                name: 'PAN',
                value: '',
              },
              {
                name: 'flgReplicateCASANominee',
                value: 'Y',
              },
              {
                name: 'flgSendSMS',
                value: 'N',
              },
              {
                name: 'makerID',
                value: 'Adobe',
              },
            ],
          },
        ],
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      journeyID: '8cdd86a6-1bf5-44ac-a17b-3d1722e72965_01_ECFD_U_WEB',
      journeyName: 'FD_BOOKING_JOURNEY',
      pseudoID: 'abcd',
    },
  },
  //
};

export {
  JOURNEY_NAME,
  CURRENT_FORM_CONTEXT,
  JOURNEY_ABBR_VALUE,
  END_POINTS,
  DATA_CONTRACT,
  DATA_LIMITS,
  INR_CONST,
};
