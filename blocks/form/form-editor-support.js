function annotateFormForEditing(formEl, formDefinition) {

    formEl.classList.add("edit-mode");
    let formFieldMap = {};
    annotateItems(formEl.childNodes);
    function annotateItems(items) {
        items.forEach((fieldWrapper) => {
            if (fieldWrapper.classList.contains("field-wrapper")) {
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
                    if (item[':items']) {
                        field = getFieldById(item[':items'], id);
                    }
                }
            }
            
        }
        return field;
    }
}

/**
 * Event listener for aue:ui-select, selection of a component
 */
function handleEditorSelect(event) {

    if (event.target.closest('.wizard') && event.detail.selected && !event.target.classList.contains("wizard")) {
      const wizardEl = event.target.closest('.wizard');
      const { resource } = event.detail;
      const el = wizardEl.querySelector(`[data-aue-resource='${resource}']`);
      const existingSelectedEl = wizardEl.querySelector(".current-wizard-step");
      existingSelectedEl.classList.remove('current-wizard-step');
      if (el.hasAttribute("data-index")) {
        //if selected element is the direct chld of wizard
        el.classList.add('current-wizard-step');
      } else {
        for(let child of wizardEl.children) {
          const isElPresentUnderChild = child.querySelector(`[data-aue-resource='${resource}']`);
          if (isElPresentUnderChild) {
            child.classList.add('current-wizard-step');
          }
        }
      }
    }
}

window.addEventListener("FORM_INITIALISED", async (event) => {
    //in case form is initialised before ui-edit
    if (document.documentElement.classList.contains("adobe-ue-edit")) {
      annotateFormForEditing(event.detail.formEl, event.detail.formDefinition);
    } else {
      document.body.addEventListener("aue:ui-edit", async () => {
        annotateFormForEditing(event.detail.formEl, event.detail.formDefinition);
      });
    }
});


document.querySelector('main').addEventListener('aue:ui-select', handleEditorSelect);
