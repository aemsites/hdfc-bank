export default async function intercept(element, globals, objVal, type){
    console.log(`element: ${element}, global: {} value: ${objVal} type: ${type}`, element);
    if(element._jsonModel.appliedCssClassNames.includes('mask-custid')){
        const module = await import('./intercepters/maskedcustomerid.js')
        module.default(element, globals, objVal[0], type[0]);
        return;
    }
    const defaultModule = await import('./intercepters/default.js');
    defaultModule.default(element, globals, objVal[0], type[0]);
}
