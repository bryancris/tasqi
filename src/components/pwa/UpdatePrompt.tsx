
import { useServiceWorkerUpdate } from '@/hooks/use-service-worker-update';
import { UpdatePromptUI } from './UpdatePromptUI';

export function UpdatePrompt() {
  const { showUpdatePrompt, updateReady, applyUpdate } = useServiceWorkerUpdate();
  
  if (!showUpdatePrompt || !updateReady) {
    return null;
  }
  
  return <UpdatePromptUI onUpdate={applyUpdate} />;
}
