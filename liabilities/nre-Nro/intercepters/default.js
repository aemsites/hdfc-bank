export default async function intercept(element, key, path, globals, val, type) {
    globals.functions.setProperty(element, {value: val});
}
