export default async function intercept(element, globals, val, type) {
    globals.functions.setProperty(element, {value: val});
}
