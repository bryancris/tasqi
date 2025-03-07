
// First declare the base interfaces and classes
declare class SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Then declare the global namespace
declare global {
  // This ensures SpeechRecognition is available in the global scope
  const SpeechRecognition: {
    new(): SpeechRecognition;
  };
  
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
    // Add our custom sharing-related properties
    __sharingIndicatorClickTime?: number;
    __sharingIndicatorClicked?: boolean;
    __eventBlockersActive?: boolean;
    __eventBlockersStartTime?: number;
    __activeSheets?: Record<string, boolean>;
    __closingSharingSheet?: string | null;
    __isClosingSharingSheet?: boolean;
    __sharingSheetCloseTime?: number;
  }
  
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export {};
