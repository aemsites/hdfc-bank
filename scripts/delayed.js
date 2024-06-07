// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './aem.js';
import { currentFormContext } from '../common/journey-utils.js';
import { sendPageloadEvent } from '../common/analytics.js';
// Core Web Vitals RUM collection
sampleRUM('cwv');

sendPageloadEvent(currentFormContext);
// add more delayed functionality here
