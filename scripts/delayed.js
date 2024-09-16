// eslint-disable-next-line import/no-cycle
import { loadScript, sampleRUM } from './aem.js';

loadScript('https://assets.adobedtm.com/80673311e435/029b16140ccd/launch-48ec56350700-development.min.js', { async: 'true' });

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
