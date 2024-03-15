/**
 * returns a decorator to decorate the field definition
 *
 * */
export default async function componentDecorator(fd) {
  console.log(fd);
  const { ':type': type = '', fieldType } = fd;
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
  // if(fieldType === 'text-input' || fieldType ===  'date-input' || fieldType === 'drop-down' || fieldType === 'email' || fieldType === 'number-input') {
  //   console.log(fd);
  // }
  return null;
}
