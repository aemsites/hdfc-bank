/**
 * Represents a layout manager for creating password input style UI components.
 */
export class DateFieldLayout {
/**
 * Restricts user from selecting the future dates.
 * @param {HTMLElement} panel - The panel element to which the date restriction will be applied
 */
  // eslint-disable-next-line class-methods-use-this
  applyLayout(panel) {
    if (panel) {
      const dateField = panel.querySelector('input');
      const textInputValue = dateField.getAttribute('edit-value');
      dateField.type = 'date';
      dateField.value = textInputValue;
      const today = new Date();
      const currentDate = today.toISOString().split('T')[0];
      dateField.setAttribute('max', currentDate);
    }
  }
}

const layout = new DateFieldLayout();

export default function dateFieldLayout(panel) {
  layout.applyLayout(panel);
  return panel;
}
