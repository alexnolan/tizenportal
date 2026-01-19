/**
 * TizenPortal Portal UI
 * 
 * Launcher grid with site cards.
 */

import { getCards, addCard, updateCard, deleteCard } from './cards.js';

/**
 * Portal container element
 */
var portalElement = null;

/**
 * Grid container element
 */
var gridElement = null;

/**
 * Currently focused card index
 */
var focusedIndex = 0;

/**
 * Initialize the portal UI
 */
export function initPortal() {
  portalElement = document.getElementById('tp-portal');
  gridElement = document.getElementById('tp-grid');

  if (!portalElement || !gridElement) {
    console.error('TizenPortal: Portal elements not found');
    return;
  }

  renderCards();
  focusCard(0);
}

/**
 * Render all cards in the grid
 */
function renderCards() {
  if (!gridElement) return;

  // Clear existing cards
  gridElement.innerHTML = '';

  // Get saved cards
  var cards = getCards();

  // Render each card
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var cardEl = createCardElement(card, i);
    gridElement.appendChild(cardEl);
  }

  // Add the "+" card
  var addCardEl = createAddCardElement(cards.length);
  gridElement.appendChild(addCardEl);
}

/**
 * Create a card element
 * @param {Object} card - Card data
 * @param {number} index - Card index
 * @returns {HTMLElement}
 */
function createCardElement(card, index) {
  var el = document.createElement('div');
  el.className = 'tp-card';
  el.setAttribute('tabindex', '0');
  el.setAttribute('data-card-id', card.id);
  el.setAttribute('data-index', index);

  // Icon
  var iconEl = document.createElement('div');
  iconEl.className = 'tp-card-icon';
  if (card.icon) {
    var img = document.createElement('img');
    img.src = card.icon;
    img.alt = card.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '8px';
    img.onerror = function() {
      this.style.display = 'none';
      iconEl.textContent = getInitial(card.name);
    };
    iconEl.appendChild(img);
  } else {
    iconEl.textContent = getInitial(card.name);
  }
  el.appendChild(iconEl);

  // Name
  var nameEl = document.createElement('div');
  nameEl.className = 'tp-card-name';
  nameEl.textContent = card.name || 'Untitled';
  el.appendChild(nameEl);

  // Click handler
  el.addEventListener('click', function() {
    launchCard(card);
  });

  // Keyboard handler
  el.addEventListener('keydown', function(event) {
    if (event.keyCode === 13) { // Enter
      event.preventDefault();
      launchCard(card);
    }
  });

  // Focus tracking
  el.addEventListener('focus', function() {
    focusedIndex = index;
  });

  return el;
}

/**
 * Create the add card element
 * @param {number} index - Index for this element
 * @returns {HTMLElement}
 */
function createAddCardElement(index) {
  var el = document.createElement('div');
  el.className = 'tp-card tp-card-add';
  el.setAttribute('tabindex', '0');
  el.setAttribute('data-index', index);

  // Icon
  var iconEl = document.createElement('div');
  iconEl.className = 'tp-card-icon';
  iconEl.textContent = '+';
  el.appendChild(iconEl);

  // Name
  var nameEl = document.createElement('div');
  nameEl.className = 'tp-card-name';
  nameEl.textContent = 'Add Site';
  el.appendChild(nameEl);

  // Click handler
  el.addEventListener('click', function() {
    showAddCardDialog();
  });

  // Keyboard handler
  el.addEventListener('keydown', function(event) {
    if (event.keyCode === 13) { // Enter
      event.preventDefault();
      showAddCardDialog();
    }
  });

  // Focus tracking
  el.addEventListener('focus', function() {
    focusedIndex = index;
  });

  return el;
}

/**
 * Get first letter of name for icon fallback
 * @param {string} name
 * @returns {string}
 */
function getInitial(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

/**
 * Launch a card (load site)
 * @param {Object} card
 */
function launchCard(card) {
  console.log('TizenPortal: Launching card:', card.name, card.url);

  if (window.TizenPortal && window.TizenPortal.loadSite) {
    window.TizenPortal.loadSite(card);
  }
}

/**
 * Show add card dialog
 * TODO: Implement proper modal
 */
function showAddCardDialog() {
  console.log('TizenPortal: Add card dialog');

  // For now, use simple prompt (will be replaced with modal)
  var name = prompt('Site name:');
  if (!name) return;

  var url = prompt('Site URL:');
  if (!url) return;

  // Ensure URL has protocol
  if (url.indexOf('://') === -1) {
    url = 'http://' + url;
  }

  var newCard = addCard({
    name: name,
    url: url,
    bundle: 'default',
    userAgent: 'tizen',
    icon: null,
  });

  console.log('TizenPortal: Added card:', newCard);

  if (window.TizenPortal) {
    window.TizenPortal.showToast('Added: ' + name);
  }

  refreshPortal();
}

/**
 * Focus a card by index
 * @param {number} index
 */
function focusCard(index) {
  var cards = gridElement.querySelectorAll('.tp-card');
  if (index >= 0 && index < cards.length) {
    cards[index].focus();
    focusedIndex = index;
  }
}

/**
 * Refresh the portal UI
 */
export function refreshPortal() {
  renderCards();
  focusCard(Math.min(focusedIndex, getCards().length)); // Focus add button if last card deleted
}

/**
 * Show the portal
 */
export function showPortal() {
  if (portalElement) {
    portalElement.style.display = 'flex';
    focusCard(focusedIndex);
  }
}

/**
 * Hide the portal
 */
export function hidePortal() {
  if (portalElement) {
    portalElement.style.display = 'none';
  }
}
