
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, PlayCircle, PauseCircle } from "lucide-react";
import { toast } from "sonner";

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setAudioChunks(chunks);
        
        // Create audio element for playback
        const audio = new Audio(url);
        setAudioElement(audio);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {!audioURL ? (
          <>
            <Button
              type="button"
              variant={isRecording ? "destructive" : "secondary"}
              onClick={isRecording ? stopRecording : startRecording}
              className="relative"
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
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <PauseCircle className="h-4 w-4" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleSave}
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
          </>
        )}
      </div>
    </div>
  );
}
