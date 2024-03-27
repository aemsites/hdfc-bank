import {
  decorateBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  loadBlock,
  loadBlocks,
} from './aem.js';
import { decorateRichtext } from './editor-support-rte.js';
import { decorateMain } from './scripts.js';
import { generateFormRendition } from '../blocks/form/form.js';

async function applyChanges(event) {

  let formFieldMap = {};

  function getFormFieldById(items, id) {
    let field;
    if (formFieldMap[id]) {
        field = formFieldMap[id];
    } else {
        for (let item of items) {
            formFieldMap[item.id] = item;
            if (item.id === id) {
                field = item;
            } else if (item.fieldType === 'panel') {
                if (item['items']) {
                    field = getFormFieldById(item['items'], id);
                }
            }
        }
    }
    return field;
  }
  function cleanUp(content) {
    const formDef = content.replaceAll('^(([^<>()\\\\[\\\\]\\\\\\\\.,;:\\\\s@\\"]+(\\\\.[^<>()\\\\[\\\\]\\\\\\\\.,;:\\\\s@\\"]+)*)|(\\".+\\"))@((\\\\[[0-9]{1,3}\\\\.[0-9]{1,3}\\\\.[0-9]{1,3}\\\\.[0-9]{1,3}])|(([a-zA-Z\\\\-0-9]+\\\\.)\\+[a-zA-Z]{2,}))$', '');
    return formDef?.replace(/\x83\n|\n|\s\s+/g, '');
  }
  // redecorate default content and blocks on patches (in the properties rail)
  const { detail } = event;

  const resource = detail?.request?.target?.resource // update, patch components
    || detail?.request?.target?.container?.resource // update, patch, add to sections
    || detail?.request?.to?.container?.resource; // move in sections
  if (!resource) return false;
  const updates = detail?.response?.updates;
  if (!updates.length) return false;
  const { content } = updates[0];
  if (!content) return false;

  const parsedUpdate = new DOMParser().parseFromString(content, 'text/html');
  const element = document.querySelector(`[data-aue-resource="${resource}"]`);

  if (element) {
    if (element.matches('main')) {
      const newMain = parsedUpdate.querySelector(`[data-aue-resource="${resource}"]`);
      newMain.style.display = 'none';
      element.insertAdjacentElement('afterend', newMain);
      decorateMain(newMain);
      decorateRichtext(newMain);
      await loadBlocks(newMain);
      element.remove();
      newMain.style.display = null;
      // eslint-disable-next-line no-use-before-define
      attachEventListners(newMain);
      return true;
    }

    const block = element.parentElement?.closest('.block[data-aue-resource]') || element?.closest('.block[data-aue-resource]');
    if (block) {
      const blockResource = block.getAttribute('data-aue-resource');
      const newBlock = parsedUpdate.querySelector(`[data-aue-resource="${blockResource}"]`);
      if (block.dataset.aueModel === 'form') {
        const newContainer = newBlock.querySelector('pre');
        const codeEl = newContainer?.querySelector('code');
        const content = codeEl?.textContent;
        if (content) {
          const formDef = JSON.parse(cleanUp(content));
          const parentPanel = element.closest('.panel-wrapper');
          const ruleEngine = await import('./blocks/form/rules/model/afb-runtime.js');
          const form = ruleEngine.createFormInstance(formDef);
          const formState = form.getState(true);
          const panelDefinition = getFormFieldById(formState['items'], parentPanel.id);
          await generateFormRendition(panelDefinition, parentPanel);
          return true;
        }
      } else if (newBlock) {
          newBlock.style.display = 'none';
          block.insertAdjacentElement('afterend', newBlock);
          decorateButtons(newBlock);
          decorateIcons(newBlock);
          decorateBlock(newBlock);
          decorateRichtext(newBlock);
          await loadBlock(newBlock);
          block.remove();
          newBlock.style.display = null;
          return true;
      }
    } else {
      // sections and default content, may be multiple in the case of richtext
      const newElements = parsedUpdate.querySelectorAll(`[data-aue-resource="${resource}"],[data-richtext-resource="${resource}"]`);
      if (newElements.length) {
        const { parentElement } = element;
        if (element.matches('.section')) {
          const [newSection] = newElements;
          newSection.style.display = 'none';
          element.insertAdjacentElement('afterend', newSection);
          decorateButtons(newSection);
          decorateIcons(newSection);
          decorateRichtext(newSection);
          decorateSections(parentElement);
          decorateBlocks(parentElement);
          await loadBlocks(parentElement);
          element.remove();
          newSection.style.display = null;
        } else {
          element.replaceWith(...newElements);
          decorateButtons(parentElement);
          decorateIcons(parentElement);
          decorateRichtext(parentElement);
        }
        return true;
      }
    }
  }
  return false;


}




function attachEventListners(main) {
  [
    'aue:content-patch',
    'aue:content-update',
    'aue:content-add',
    'aue:content-move',
    'aue:content-remove',
  ].forEach((eventType) => main?.addEventListener(eventType, async (event) => {
    event.stopPropagation();
    const applied = await applyChanges(event);
    if (!applied) window.location.reload();
  }));
}

attachEventListners(document.querySelector('main'));