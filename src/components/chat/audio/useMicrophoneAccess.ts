import { useToast } from "@/hooks/use-toast";

export function useMicrophoneAccess() {
  const { toast } = useToast();

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            toast({
              title: "Permission Denied",
              description: "Please grant microphone access in your browser settings.",
              variant: "destructive",
            });
            break;
          case 'NotFoundError':
            toast({
              title: "No Microphone Found",
              description: "Please check your microphone connection.",
              variant: "destructive",
            });
            break;
          default:
            toast({
              title: "Microphone Error",
              description: "Could not access your microphone. Please try again.",
              variant: "destructive",
            });
        }
      }
      
      return null;
    }
  };

  return { requestMicrophoneAccess };
}