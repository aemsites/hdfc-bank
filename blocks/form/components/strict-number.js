// Description: This script will prevent the user from entering anything other than 0-9 in the input field.
// It doesn't work for locales where non ASCII digits are used.
// It also shows correct keyboard on mobile devices.

const allowedChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];

const regex = new RegExp(`^[${allowedChars.join('')}]+$`);

function containsInvalidCharacter(data) {
  return !regex.test(data);
}

function containsDuplicateDecimal(currentVal, data) {
  return (currentVal.includes('.') && data.includes('.')) || data.match(/\./g)?.length > 1;
}

function isInvalidEntry(currentVal, data) {
  return containsInvalidCharacter(data) || containsDuplicateDecimal(currentVal, data);
}

export default function decorate(fieldDiv, field, htmlForm) {
  // look for the input element inside the field div
  const input = fieldDiv.querySelector('input');
  input.type = 'text';
  // prevent beforeinput event if the data entered or pasted contains non-numeric characters
  input.addEventListener('beforeinput', (e) => {
    const { data, dataTransfer, isComposing } = e;
    if (isComposing) {
      return;
    }
    const { value } = e.target;
    if (data && isInvalidEntry(value, data)) {
      e.preventDefault();
    }
    if (dataTransfer) {
      const clipboardData = dataTransfer?.getData('text/plain');
      if (clipboardData && isInvalidEntry(value, clipboardData)) {
        e.preventDefault();
      }
    }
  });
  input.setAttribute('inputmode', 'numeric');
  return fieldDiv;
}
