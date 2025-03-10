
// Re-export all platform detection utilities to maintain API compatibility
export * from './core';
export * from './sharing-protection';
export * from './shield-overlay';

// Clean up any stuck protection states on module load
import { resetProtectionStates } from './core';
import { clearAllProtectionStates } from './sharing-protection';
import { removeAllShields } from './shield-overlay';

// Execute cleanup on module initialization
(function cleanupStuckProtections() {
  console.log('🧹 Cleaning up any stuck protection states');
  resetProtectionStates();
  clearAllProtectionStates();
  removeAllShields();
})();
