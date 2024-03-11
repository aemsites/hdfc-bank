import {
  buildBlock, decorateBlock, loadBlock, loadCSS, decorateIcons,
} from '../../scripts/aem.js';

async function createMainModal(conntentNodes) {
  await loadCSS('/components/modal/modal.css');
  const dialog = document.createElement('dialog');
  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');
  dialogContent.append(conntentNodes);
  dialog.append(dialogContent);
  const closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.type = 'button';
  closeButton.innerHTML = '<span class="icon icon-close">X</span>';
  closeButton.addEventListener('click', () => dialog.close());
  dialog.append(closeButton);
  //   const buttonNodes = document.getElementsByTagName('button')[0];
  //   buttonNodes.addEventListener('click', () => dialog.close());
  //   dialog.append(buttonNodes);

  // close dialog on clicks outside the dialog. https://stackoverflow.com/a/70593278/79461
  dialog.addEventListener('click', (event) => {
    const dialogDimensions = dialog.getBoundingClientRect();
    if (event.clientX < dialogDimensions.left
          || event.clientX > dialogDimensions.right
        || event.clientY < dialogDimensions.top
  || event.clientY > dialogDimensions.bottom
    ) {
      dialog.close();
    }
  });
  const block = buildBlock('modal', '');
  document.querySelector('main').append(block);
  decorateBlock(block);
  await loadBlock(block);
  decorateIcons(closeButton);
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

async function openModal(contentNode) {
  const { showModal } = await createMainModal(contentNode);
  showModal();
}

export default openModal;
