import { getFederatedContentRoot, getFederatedUrl } from '../../utils/federated.js';
import { loadLink } from '../../utils/utils.js';

let fetchedIcons;
let fetched = false;

async function getSVGsfromFile(path) {
  /* c8 ignore next */
  if (!path) return null;
  const resp = await fetch(path);
  /* c8 ignore next */
  if (!resp.ok) return null;
  const miloIcons = {};
  const text = await resp.text();
  const parser = new DOMParser();
  const parsedText = parser.parseFromString(text, 'image/svg+xml');
  const symbols = parsedText.querySelectorAll('symbol');
  symbols.forEach((symbol) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    while (symbol.firstChild) svg.appendChild(symbol.firstChild);
    [...symbol.attributes].forEach((attr) => svg.attributes.setNamedItem(attr.cloneNode()));
    svg.classList.add('icon-milo', `icon-milo-${svg.id}`);
    miloIcons[svg.id] = svg;
  });
  return miloIcons;
}

// eslint-disable-next-line no-async-promise-executor
export const fetchIcons = (icons, config) => new Promise(async (resolve) => {
  /* c8 ignore next */
  if (!fetched) {
    const { miloLibs, codeRoot } = config;
    const base = miloLibs || codeRoot;
    fetchedIcons = await getSVGsfromFile(`${base}/img/icons/icons.svg`);
    fetched = true;
  }
  resolve(fetchedIcons);
});

function decorateToolTip(icon) {
  const wrapper = icon.closest('em');
  wrapper.className = 'tooltip-wrapper';
  if (!wrapper) return;
  const conf = wrapper.textContent.split('|');
  // Text is the last part of a tooltip
  const content = conf.pop().trim();
  if (!content) return;
  icon.dataset.tooltip = content;
  // Position is the next to last part of a tooltip
  const place = conf.pop()?.trim().toLowerCase() || 'right';
  icon.className = `icon icon-info milo-tooltip ${place}`;
  wrapper.parentElement.replaceChild(icon, wrapper);
}

export async function getSvgFromFile(path, name) {
  /* c8 ignore next */
  if (!path) return null;

  let resp;
  try {
    // if (fetchedIcons[name] === undefined) return fetchIcons[name];
    resp = await fetch(path);
    const text = await resp.text();
    const parser = new DOMParser();
    const parsedText = parser.parseFromString(text, 'image/svg+xml');
    const svg = parsedText.firstChild;
    svg.id = name;
    const parsedSvg = parsedText.querySelector('svg');
    parsedSvg.classList.add('icon-milo', `icon-milo-${name}`);
    fetchedIcons[name] = parsedSvg;
    return parsedSvg;
  } catch (error) {
    return '⚠️';
  }
}

async function decorateIcon(icon, config) {
  const iconName = Array.from(icon.classList)
    .find((c) => c.startsWith('icon-'))
    .substring(5);
  if (fetchedIcons[iconName] !== undefined || iconName === 'tooltip') return icon;
  const fedRoot = getFederatedContentRoot();
  const svgFedPath = `${fedRoot}/federal/assets/icons/svgs/${iconName}.svg`;
  const svgFedAemPath = `https://stage--federal--adobecom.aem.page/img/favicons
/${iconName}.svg`;
  const svgFedAemPathLive = `https://adobe.com/federal/assets/icons/svgs/${iconName}.svg`;
  // const { miloLibs, codeRoot } = config;
  // const base = miloLibs || codeRoot;
  // console.log('fedRoot', fedRoot);
  // const newIcon = await getSvgFromFile(`${base}/img/icons/s1/${iconName}.svg`, iconName);
  // console.log('fedRoot', fedRoot, `https://main--federal--adobecom.aem.page/federal/libs/img/icons/svgs/${iconName}.svg`);
  // console.log(`${fedRoot}/federal/libs/img/icons/svgs/${iconName}.svg`);
  // console.log('fedUrl', fedUrl);

  // set link in header
  // const newSvg = loadLink(svgFedPath, { rel: 'preload', as: 'fetch', crossorigin: 'anonymous' });
  console.log('svgFed path', svgFedPath, 'fedRoot', fedRoot);
  const newIcon = await getSvgFromFile(svgFedAemPath, iconName);
  if (!newIcon) fetchedIcons[iconName] = undefined;
  console.log('Error:', iconName, newIcon);
  return newIcon;
}

export default async function loadIcons(icons, config) {
  const iconSVGs = await fetchIcons(icons, config);
  if (!iconSVGs) return;
  icons.forEach(async (icon) => {
    await decorateIcon(icon, config);
    const { classList } = icon;
    if (classList.contains('icon-tooltip')) decorateToolTip(icon);
    const iconName = icon.classList[1].replace('icon-', '');
    const existingIcon = icon.querySelector('svg');
    if (!iconSVGs[iconName] || existingIcon) return;
    const parent = icon.parentElement;
    if (parent.childNodes.length > 1) {
      if (parent.lastChild === icon) {
        icon.classList.add('margin-inline-start');
      } else if (parent.firstChild === icon) {
        icon.classList.add('margin-inline-end');
        if (parent.parentElement.tagName === 'LI') parent.parentElement.classList.add('icon-list-item');
      } else {
        icon.classList.add('margin-inline-start', 'margin-inline-end');
      }
    }
    icon.insertAdjacentHTML('afterbegin', iconSVGs[iconName].outerHTML);
  });
}
