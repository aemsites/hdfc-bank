// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './aem.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
// eslint-disable-next-line import/no-unresolved
import('../creditcards/fd-card/launch-dev.min.js');

// eslint-disable-next-line import/no-unresolved
import('../creditcards/fd-card/fd-delayedutils.js');
