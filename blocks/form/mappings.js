/**
 * returns a decorator to decorate the field definition
 *
 * */
export default async function componentDecorator(fd) {
  const { ':type': type = '', fieldType, name } = fd;
  if (fieldType === 'file-input') {
    const module = await import('./components/file.js');
    return module.default;
  }
  if (type.endsWith('wizard')) {
    const module = await import('./components/wizard.js');
    return module.default;
  }
  if (fd.id.includes('accordion')) {
    const module = await import('./components/accordion.js');
    return module.default;
  }
  if (name === 'registeredMobileNumber') {
    const module = await import('./components/strict-number.js');
    return module.default;
  }
  return null;
}
