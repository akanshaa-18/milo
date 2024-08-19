/* eslint-disable class-methods-use-this */
import { selectors } from './utils.js';
import MainNav from './mainNav.js';
import { closeAllDropdowns, lanaLog, logErrorFor } from '../utilities.js';

const openProfile = ({ e, el }) => {
  const button = e.target.closest(`${selectors.signIn}, ${selectors.profileButton}`);
  if (button?.getAttribute('aria-expanded') === 'false') {
    e.target.click();
    el.querySelector(selectors.profileDropdown)?.focus();
    return true;
  }
  return false;
};

const getProfileItems = ({ e }) => {
  const profileDropdownLinks = document.querySelectorAll(selectors.profileDropdown);
  if (!profileDropdownLinks.length) return { next: -1, prev: -1, items: [] };
  const items = [...profileDropdownLinks];
  const curr = items.findIndex((element) => element === e.target);
  return { next: curr + 1, prev: curr - 1, curr, items };
};

const closeProfile = () => {
  closeAllDropdowns();
  document.querySelector(`${selectors.profileButton}, ${selectors.signIn}`)?.focus();
};

const focusNextProfileItem = ({ e }) => {
  const { items, next } = getProfileItems({ e });
  if (items[next]) {
    items[next].focus();
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  closeProfile();
};

const focusPrevProfileItem = ({ e }) => {
  const { items, prev } = getProfileItems({ e });
  if (items[prev]) {
    items[prev].focus();
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  closeProfile();
};

class KeyboardNavigation {
  constructor() {
    try {
      this.addEventListeners();
      this.mainNav = new MainNav();
      this.desktop = window.matchMedia('(min-width: 900px)');
    } catch (e) {
      lanaLog({ message: 'Keyboard Navigation failed to load', e, tags: 'errorType=error,module=gnav-keyboard' });
    }
  }

  addEventListeners = () => {
    [...document.querySelectorAll(`${selectors.globalNav}, ${selectors.globalFooter}`)]
      .forEach((el) => {
        el.addEventListener('keydown', (e) => logErrorFor(() => {
          switch (e.code) {
            case 'Tab': {
              const { items } = getProfileItems({ e });

              const profileBtn = e.target.closest(`${selectors.signIn}, ${selectors.profileButton}`);
              if (e.shiftKey && e.target === profileBtn) closeProfile();
              if (items[items.length - 1] === e.target) {
                e.preventDefault();
                e.stopPropagation();
                closeProfile();
              }
              break;
            }
            case 'Enter':
            case 'Space': {
              e.stopPropagation();
              e.preventDefault();
              e.target.click();
              break;
            }
            case 'ArrowDown': {
              if (e.target.closest(selectors.profile)) {
                if (openProfile({ e, el })) break;
                focusNextProfileItem({ e });
              }
              break;
            }
            case 'ArrowUp': {
              if (e.target.closest(selectors.profile)) {
                focusPrevProfileItem({ e });
              }
              break;
            }
            default:
              break;
          }
        }, `KeyboardNavigation index failed. ${e.code}`, 'errorType=error,module=gnav-keyboard'));
      });
  };
}

export default KeyboardNavigation;
