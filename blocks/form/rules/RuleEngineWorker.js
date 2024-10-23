import { createFormInstance } from './model/afb-runtime.js';
import registerCustomFunctions from './functionRegistration.js';

let customFunctionRegistered = false;

export default class RuleEngine {
  rulesOrder = {};

  createFormInstance(formDef) {
    this.form = createFormInstance(formDef);
  }

  getState() {
    return this.form.getState(true);
  }

  getFieldChanges() {
    return this.fieldChanges;
  }
}

let ruleEngine;
onmessage = (e) => {
  async function handleMessageEvent(event) {
    switch (event.data.name) {
      case 'init':
        ruleEngine = new RuleEngine();
        ruleEngine.createFormInstance(event.data.payload);
        // eslint-disable-next-line no-case-declarations
        const state = ruleEngine.getState();
        postMessage({
          name: 'init',
          payload: state,
        });
        ruleEngine.dispatch = (msg) => {
          postMessage(msg);
        };
        break;
      default:
        break;
    }
  }

  if (!customFunctionRegistered) {
    const { id } = e.data.payload;
    registerCustomFunctions(id).then(() => {
      customFunctionRegistered = true;
      handleMessageEvent(e);
    });
  }
};
