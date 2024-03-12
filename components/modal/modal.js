import {
  buildBlock, decorateBlock, loadBlock, loadCSS,
} from '../../scripts/aem.js';

async function createMainModal(content, actionWrapClass, reqConsentAgree) {
  // const { content, actionWrapClass, reqConsentAgree } = conntentNodes;
  await loadCSS('/components/modal/modal.css');
  const dialog = document.createElement('dialog');
  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');
  dialogContent.append(content);
  dialog.append(dialogContent);
  const closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.type = 'button';
  closeButton.innerHTML = '<span class="icon icon-close">X</span>';
  closeButton.addEventListener('click', () => dialog.close());
  // dialog.append(closeButton);
  if (!reqConsentAgree) {
    dialog.append(closeButton);
  }
  // close dialog on clicks outside the dialog. https://stackoverflow.com/a/70593278/79461
  // dialog button parsed binding close action for each buttons
  const consentBtns = content.childNodes;
  const formBtnWrap = Array.from(consentBtns).filter((node) => node.nodeType === 1 && node.classList.contains(`${actionWrapClass}`));
  formBtnWrap.forEach((element) => {
    const actionBtns = element.querySelectorAll('button');
    actionBtns.forEach((button) => {
      // providing close functionalities to all the btns available
      button.addEventListener('click', () => dialog.close());
    });
  });
  const block = buildBlock('modal', '');
  document.querySelector('main').append(block);
  decorateBlock(block);
  await loadBlock(block);
  // decorateIcons(closeButton);
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
  });

  block.append(dialog);

  return {
    block,
    showModal: () => {
      dialog.showModal();
      // Google Chrome restores the scroll position when the dialog is reopened,
      // so we need to reset it.
      setTimeout(() => {
        dialogContent.scrollTop = 0;
      }, 0);

      document.body.classList.add('modal-open');
    },
  };
}

/**
 * Opens a modal dialog with the specified content, action wrapper class, and consent requirement.
 * Asynchronously creates and displays a modal dialog using the provided content and configuration.
 * @async
 * @param {HTMLElement} content - The content to be displayed in the modal dialog.
 * @param {string} actionWrapClass - The class name of the wrapper containing action buttons.
 * @param {boolean} reqConsentAgree - Whether consent agreement is required to close the modal.
 * @returns {Promise<void>} - A promise that resolves when the modal is opened.
 */
async function openModal({ content, actionWrapClass, reqConsentAgree }) {
  const { showModal } = await createMainModal(content, actionWrapClass, reqConsentAgree);
  showModal();
}

export default openModal;
