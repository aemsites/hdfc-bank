export function annotateFormForEditing(formEl, formDefinition) {
    formEl.classList.add("edit-mode");
    const observer = new MutationObserver(annotateForm);
    const config = { childList: true, subtree: true };
    observer.observe(formEl, config);
    let formFieldMap = {};
    function annotateForm(mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach((fieldWrapper) => {
                    if (fieldWrapper.classList.contains("field-wrapper")) {
                        console.log(fieldWrapper);
                        const id = fieldWrapper.id;
                        const fd = getFieldById(formDefinition[":items"], id);
                        if (fd.properties) {
                            fieldWrapper.setAttribute('data-aue-type', 'component');
                            fieldWrapper.setAttribute('data-aue-resource', `urn:aemconnection:${fd.properties["fd:path"]}`);
                            fieldWrapper.setAttribute('data-aue-model', fd.fieldType === 'image'? 'form-image': fd.fieldType);
                            fieldWrapper.setAttribute('data-aue-label', fd.name);
                        }
                        if (fieldWrapper.classList.contains("form-panel-wrapper")) {
                            fieldWrapper.setAttribute('data-aue-type', 'container');
                            fieldWrapper.setAttribute('data-aue-behavior', 'component');
                        }
                    }
                });
            }
        }
    }

    function getFieldById(items, id) {
        if (formFieldMap[id]) {
            return formFieldMap[id];
        } else {
            for (let item of  Object.values(items)) {
                formFieldMap[item.id] = item;
                if (item.id === id) {
                    return item;
                } else if (item.fieldType === 'panel') {
                    return getFieldById(item[':items'], id)
                }
            }
        }
    }
}
