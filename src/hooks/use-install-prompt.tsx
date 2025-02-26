
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('👋 Before install prompt event captured');
      setDeferredPrompt(e);
      setInstallable(true);
    };

    const checkInstallState = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true ||
                          window.location.search.includes('standalone=true');
      
      setIsStandalone(isStandalone);
      console.log('📱 App standalone status:', isStandalone);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS && !isStandalone) {
        console.log('🍎 Running on iOS - installation requires manual steps');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installed successfully');
      setInstallable(false);
      setIsStandalone(true);
      toast.success('App installed successfully!');
    });

    checkInstallState();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return {
    deferredPrompt,
    isStandalone,
    installable,
    setDeferredPrompt
  };
}
