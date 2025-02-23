
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, PlayCircle, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface VoiceNoteRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export function VoiceNoteRecorder({ onRecordingComplete, onCancel }: VoiceNoteRecorderProps) {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check for microphone permission on component mount
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Release the stream
      setHasPermission(true);
    } catch (error) {
      console.error('Microphone permission error:', error);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Determine the correct mime type based on browser support
      const mimeType = 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setAudioChunks(chunks);
        
        // Create audio element for playback
        const audio = new Audio(url);
        audio.onended = () => setIsPlaying(false);
        setAudioElement(audio);

        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      // Stop all tracks in the stream
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handlePlayPause = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSave = () => {
    if (audioChunks.length > 0) {
      const finalBlob = new Blob(audioChunks, { type: 'audio/webm' });
      onRecordingComplete(finalBlob);
    }
  };

  if (!hasPermission) {
    return (
      <div className="space-y-4 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Microphone access is required to record voice notes.
          Please allow microphone access in your browser settings.
        </p>
        <Button
          type="button"
          variant="default"
          onClick={checkMicrophonePermission}
        >
          Request Microphone Access
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${isMobile ? 'p-4' : ''}`}>
      <div className="flex items-center gap-2">
        {!audioURL ? (
          <>
            <Button
              type="button"
              variant={isRecording ? "destructive" : "secondary"}
              onClick={isRecording ? stopRecording : startRecording}
              className="relative flex-1"
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handlePlayPause}
              className="flex-1"
            >
              {isPlaying ? (
                <>
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Play
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleSave}
              className="flex-1"
            >
              Save Voice Note
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
