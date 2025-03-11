
/// <reference types="vite-plugin-pwa/client" />

/**
 * Type declarations for virtual modules provided by vite-plugin-pwa
 */

declare module 'virtual:pwa-register/react' {
  import type { RegisterSWOptions } from 'vite-plugin-pwa/types';
  
  export type { RegisterSWOptions };
  
  export interface UseRegisterSWReturn {
    needRefresh: [boolean, (value: boolean) => void];
    offlineReady: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  }
  
  export function useRegisterSW(options?: RegisterSWOptions): UseRegisterSWReturn;
}

declare module 'virtual:pwa-info' {
  export interface PwaInfo {
    webManifest: { href: string; useCredentials: boolean; };
    registerSW?: { scope: string; type: string; };
    beforeInstallPrompt: boolean;
  }

  export function usePwaInfo(): PwaInfo;
}
