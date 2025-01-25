export default async function intercept(element, key, path, globals, val, type) {
    val = val.toString();
    val = 'X'.repeat((val.length - 4))
        +
        val.slice(val.length -4, val.length);
    globals.functions.setProperty(element, {value: val});
}