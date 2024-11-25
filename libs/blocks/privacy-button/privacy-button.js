import { createTag } from '../../utils/utils.js';
import { decorateButtons } from '../../utils/decorate.js';

function injectTrackingImage(url) {
  const img = createTag('img', {
    src: url,
    class: 'privacy-tracking-image',
    'aria-hidden': 'true',
  });
  document.body.appendChild(img);
}

function handleUrlVariant(button, urls, message) {
  button.addEventListener('click', () => {
    urls.split(',').forEach((url) => {
      const trimmedUrl = url.trim();
      if (trimmedUrl.match('^http') !== null) {
        injectTrackingImage(trimmedUrl);
      }
    });
    // Create a new element for the success message
    button.parentNode.replaceChild(createTag('span', { class: 'privacy-button-message' }, message), button);
  });
}

export default function init(el) {
  const config = {};
  el.querySelectorAll(':scope > div').forEach((row) => {
    const [key, value] = [...row.children];
    if (key && value) {
      config[key.textContent.trim().toLowerCase()] = value.textContent.trim();
    }
  });

  const button = createTag('button', {
    class: 'con-button blue',
    type: 'button',
  }, config['button-label']);

  if (config['button-label'] && config['confirmation-message'] && config.url) {
    handleUrlVariant(button, config.url, config['confirmation-message']);
  }

  el.innerHTML = '';
  el.append(button);
  decorateButtons(el);
}