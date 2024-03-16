export function annotateFormForEditing(formEl, formDefinition) {
    formEl.classList.add("edit-mode");
    const observer = new MutationObserver(annotateForm);
    const config = { childList: true, subtree: true };
    observer.observe(formEl, config);
    let formFieldMap = {};
    function annotateForm(mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                annotateItems(mutation.addedNodes);
            }
        }
    }
    function annotateItems(items) {
        items.forEach((fieldWrapper) => {
            if (fieldWrapper.classList.contains("field-wrapper")) {
                console.log(fieldWrapper);
                const id = fieldWrapper.id;
                const fd = getFieldById(formDefinition[":items"], id);
                if (fd && fd.properties) {
                    fieldWrapper.setAttribute('data-aue-type', 'component');
                    fieldWrapper.setAttribute('data-aue-resource', `urn:aemconnection:${fd.properties["fd:path"]}`);
                    fieldWrapper.setAttribute('data-aue-model', fd.fieldType === 'image'? 'form-image': fd.fieldType);
                    fieldWrapper.setAttribute('data-aue-label', fd.name);
                } else {
                    console.warn(`field ${id} not found in form definition`);
                }
                if (fieldWrapper.classList.contains("form-panel-wrapper")) {
                    fieldWrapper.setAttribute('data-aue-type', 'container');
                    fieldWrapper.setAttribute('data-aue-behavior', 'component');
                    annotateItems(fieldWrapper.childNodes);
                }
            }
        });
    }

    function getFieldById(items, id) {
        let field;
        if (formFieldMap[id]) {
            field = formFieldMap[id];
        } else {
            for (let item of  Object.values(items)) {
                formFieldMap[item.id] = item;
                if (item.id === id) {
                    field = item;
                } else if (item.fieldType === 'panel') {
                    field = getFieldById(item[':items'], id)
                }
            }
        }
        return field;
    }
}
