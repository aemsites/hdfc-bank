/**
 * Represents a layout manager for creating password input style UI components.
 */
export class PasswordLayout {
/**
 * Changes the text field type to password field.
 * @param {HTMLElement} panel - The panel element to which the password style bullet will be applied.
 */
  // eslint-disable-next-line class-methods-use-this
  applyLayout(panel) {
    if (panel) {
      const inputField = panel.querySelector('input[type="text"]');
      inputField.type = 'password';
    //   inputField.addEventListener('click', (e) => {
    //     const targetEle = e.target;
    //     console.log(targetEle);
    //     if (targetEle && targetEle.matches('.password-field::after')) {
    //       inputField.type = inputField.type === 'password' ? 'text' : 'password';
    //     }
    //   });
    }
  }
}

const layout = new PasswordLayout();

export default function passwordLayout(panel) {
  layout.applyLayout(panel);
  return panel;
}
