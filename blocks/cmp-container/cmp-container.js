import {
  imageClickable,
} from '../form/util.js';

export default function decorate(block) {
  // Logo Clickable
  imageClickable('header .cmp-container > div:nth-child(1) > div > picture > img', 'https://www.hdfcbank.com/');
  const image = block.querySelector('picture');
  if (image) {
    document.querySelector('header').append(block);
  } else {
    block.parentElement.parentElement.remove();
    document.querySelector('footer').append(block);
  }
}
