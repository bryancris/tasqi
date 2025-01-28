import { Image, MessageCircle, Mic, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function ChatBubble() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    // TODO: Handle message submission
    setMessage("");
  };

  const checkMicrophoneAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');
      
      if (!hasMicrophone) {
        throw new Error("No microphone found on this device");
      }
      
      return true;
    } catch (error) {
      console.error('Error checking microphone:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const micAvailable = await checkMicrophoneAvailability();
      if (!micAvailable) {
        toast({
          title: "No Microphone Found",
          description: "Please ensure your device has a microphone and it's properly connected.",
          variant: "destructive",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onload = async () => {
          if (typeof reader.result === 'string') {
            const base64Audio = reader.result.split(',')[1];
            
            try {
              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { audio: base64Audio }
              });

              if (error) throw error;
              if (data.text) {
                setMessage(data.text);
              }
            } catch (error) {
              console.error('Error transcribing audio:', error);
              toast({
                title: "Transcription Failed",
                description: "Could not convert your speech to text. Please try again.",
                variant: "destructive",
              });
            }
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Click the microphone button again to stop recording.",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      let errorMessage = "Could not access microphone. ";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage += "Please grant microphone permissions in your browser settings.";
            break;
          case 'NotFoundError':
            errorMessage += "No microphone found. Please check your device connections.";
            break;
          default:
            errorMessage += "Please check your permissions and device connections.";
        }
      }
      
      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "Processing your audio...",
      });
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-teal-600 hover:bg-teal-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed bottom-[4.5rem] right-4 mb-0 p-0 sm:max-w-[440px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 origin-bottom-right">
        <div className="flex h-[600px] flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-base">AI Assistant</DialogTitle>
                <p className="text-sm text-muted-foreground">Here to help manage your tasks</p>
              </div>
            </div>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex justify-start">
              <div className="rounded-lg bg-secondary p-3 max-w-[80%]">
                <p className="text-sm">Hello! How can I help you today?</p>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Chat with AI to manage your tasks... (Press Enter to send)"
                className="pr-32 py-6"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                  <Image className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  className={`h-8 w-8 ${isRecording ? 'text-red-500' : ''}`}
                  onClick={handleMicClick}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="submit" size="icon" className="h-8 w-8">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}