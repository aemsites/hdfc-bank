/**
 * Represents a layout manager for creating password input style UI components.
 */
export default function passwordLayout(panel) {
  const inputField = panel.querySelector('input[type="text"]');
  inputField.type = 'password';
  return panel;
}
