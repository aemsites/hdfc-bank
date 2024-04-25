/**
 * Represents a layout manager for displaying floating field labels.
 */
export class FloatingFieldLayout {
/**
 * Changes the label from placeholder to a legend on focus.
 * @param {HTMLElement} panel - The panel element in which the label tag will be the legend in the end.
 */
  // eslint-disable-next-line class-methods-use-this
  applyLayout(panel) {
    if (panel) {
      const inputField = panel.querySelector('input') || panel.querySelector('select');
      const wrapper = inputField?.closest('.field-wrapper');
      inputField?.addEventListener('focus', () => {
        wrapper.dataset.active = 'true';
        wrapper.dataset.empty = !inputField.value;
      });
      inputField?.addEventListener('blur', () => {
        delete wrapper.dataset.active;
        wrapper.dataset.empty = !inputField.value;
      });
      if (wrapper?.dataset) {
        wrapper.dataset.empty = !inputField.value;
      }
    }
  }
}

const layout = new FloatingFieldLayout();

export default function floatingFieldLayout(panel) {
  layout.applyLayout(panel);
  return panel;
}
