async function decorateHero(el, fg) {
  const { default: nav } = await import('../header/header.js');
  const navblock = await nav(fg);
  navblock.querySelector('li:first-child').remove();
}

function decorateEngage(el) {

}

function decorateAbout(el) {

}

function decorateGeneric(el) {

}

export default function init(el) {
  const variant = el.className;
  const children = el.querySelectorAll(':scope > div');
  children.forEach((child, idx) => {
    child.className = idx === 0 ? 'bg' : 'fg';
  });
  const pics = children[0].querySelectorAll(':scope > div picture');
  pics.forEach((pic, idx) => {
    const bgItem = document.createElement('div');
    bgItem.className = `bg-item item-${idx + 1}`;
    bgItem.append(pic);
    children[0].append(bgItem);
  });
  children[0].querySelector(':scope > div').remove();
  switch (variant) {
    case 'section home hero':
      decorateHero(el, children[1]);
      break;
    case 'section engage':
      decorateEngage(el);
      break;
    case 'section about':
      decorateAbout(el);
      break;
    default:
      decorateGeneric(el);
  }
}
