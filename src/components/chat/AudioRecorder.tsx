import { useAudioRecording } from "./audio/useAudioRecording";
import { MicrophoneButton } from "./audio/MicrophoneButton";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const { isRecording, startRecording, stopRecording } = useAudioRecording(onTranscriptionComplete);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <MicrophoneButton 
      isRecording={isRecording} 
      onClick={handleMicClick}
    />
  );
}