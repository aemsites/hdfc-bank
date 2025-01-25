export default async function intercept(element, key, path, globals, objVal, type){
    console.log(`element: ${element}, global: {} path: ${path} value: ${objVal} key: ${key} type: ${type}`, element);
    if(element._jsonModel.appliedCssClassNames.includes('mask-custid')){
        const module = await import('./intercepters/maskedcustomerid.js')
        module.default(element, key, path, globals, objVal, type);
        return;
    }
    const defaultModule = await import('./intercepters/default.js');
    defaultModule.default(element, key, path, globals, objVal, type);
}
