/**
 * Userscript Sandbox Bundle
 * 
 * Provides a safe place to experiment with user scripts.
 */

import styles from './style.css';

export default {
  name: 'userscript-sandbox',
  displayName: 'Userscript Sandbox',
  description: 'Sample user scripts and a playground for custom script injection.',
  style: styles,

  onActivate: function(win, card) {
    try {
      if (win && win.TizenPortal && win.TizenPortal.log) {
        win.TizenPortal.log('Userscript Sandbox: Active');
      }
    } catch (err) {
      // Ignore
    }
  },

  onDeactivate: function() {
    // No-op
  },
};
