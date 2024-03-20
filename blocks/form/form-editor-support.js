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
                if (fieldWrapper.classList.contains("panel-wrapper")) {
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

async function instrumentForms(mutationsList) {

    let formsEl = [];
    mutationsList.forEach(mutation => {
        // Check if the mutation type is 'childList' and if nodes are added
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
           
            mutation.addedNodes.forEach(node => {
                // Check if the added node is a form element
                if (node.nodeName.toLowerCase() === 'form') {
                    formsEl.push(node);
                }
            });
        }
    });
    annotateFormsForEditing(formsEl);
}

async function annotateFormsForEditing(forms) {
    for(let form of forms) {
        const formDefResp = await fetch(`${form.dataset.formpath}.model.json`);
        const formDef = await formDefResp.json();
        console.log('formDef', formDef);
        annotateFormForEditing(form, formDef);
    }
}

function enableRuleEditorExtension() {
    let head = document.getElementsByTagName('head')[0];
    var meta = document.createElement('meta');
    meta.name = "urn:adobe:aue:config:extensions";
    meta.content = "https://283250-452aquachinchilla-stage.adobeio-static.net";
    head.appendChild(meta);
}

const observer = new MutationObserver(instrumentForms);
observer.observe(document, { childList: true, subtree: true, attributeFilter: ['form'] });
const forms = document.querySelectorAll('form');
annotateFormsForEditing(forms);
document.querySelector('main')?.addEventListener('aue:ui-select', handleEditorSelect);
enableRuleEditorExtension();

document.body.addEventListener("aue:ui-preview", () => {

    const forms = document.querySelectorAll('form');
    for(let formEl of forms) {
        formEl.classList.remove("edit-mode");
    }
});

document.body.addEventListener("aue:ui-edit", () => {
    const forms = document.querySelectorAll('form');
    for(let formEl of forms) {
        if (!formEl.classList.contains("edit-mode")) {
            formEl.classList.add("edit-mode");
        }
    }
});