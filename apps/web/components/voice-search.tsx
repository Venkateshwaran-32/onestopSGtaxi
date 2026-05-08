'use client';

import * as React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { parseVoiceQuery } from '@/lib/voice-parser';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type SpeechResult = {
  transcript: string;
  isFinal: boolean;
};

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<SpeechResult>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

function getRecognitionClass(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function VoiceSearch() {
  const setPickup = useAppStore((s) => s.setCurrentPickup);
  const setDropoff = useAppStore((s) => s.setCurrentDropoff);
  const history = useAppStore((s) => s.history);
  const [recording, setRecording] = React.useState(false);
  const [supported, setSupported] = React.useState<boolean | null>(null);
  const [interim, setInterim] = React.useState('');
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);

  React.useEffect(() => {
    setSupported(getRecognitionClass() !== null);
  }, []);

  const handleResult = React.useCallback(
    (transcript: string) => {
      setInterim('');
      const recentPlaces = history
        .flatMap((h) => [h.pickup, h.dropoff])
        .filter((p, i, arr) => arr.findIndex((x) => x.label === p.label) === i);
      const parsed = parseVoiceQuery(transcript, recentPlaces);

      if (parsed.pickup) setPickup(parsed.pickup);
      if (parsed.dropoff) setDropoff(parsed.dropoff);

      track('voice_parsed', {
        transcript,
        matched_pickup: !!parsed.pickup,
        matched_dropoff: !!parsed.dropoff,
      });

      if (!parsed.pickup && !parsed.dropoff) {
        setFeedback(`Couldn't match "${transcript}" to any SG location.`);
      } else if (!parsed.pickup) {
        setFeedback(`Set destination. Say "from X to Y" to fill both.`);
      } else if (!parsed.dropoff) {
        setFeedback('Got pickup but missed destination.');
      } else {
        setFeedback(null);
      }
    },
    [history, setPickup, setDropoff],
  );

  const start = React.useCallback(() => {
    const Recog = getRecognitionClass();
    if (!Recog) {
      setFeedback('Voice search isn\'t supported in this browser.');
      return;
    }
    setFeedback(null);
    setInterim('');

    const r = new Recog();
    r.lang = 'en-SG';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result || !result[0]) continue;
        const part = result[0];
        if (part.isFinal) finalTranscript += part.transcript;
        else interimTranscript += part.transcript;
      }
      if (interimTranscript) setInterim(interimTranscript);
      if (finalTranscript) handleResult(finalTranscript);
    };

    r.onerror = (event) => {
      setRecording(false);
      if (event.error === 'no-speech') setFeedback('Didn\'t hear anything.');
      else if (event.error === 'not-allowed')
        setFeedback('Microphone permission denied.');
      else setFeedback('Voice search failed.');
    };

    r.onend = () => {
      setRecording(false);
      setInterim('');
    };

    recognitionRef.current = r;
    try {
      r.start();
      setRecording(true);
      track('voice_started');
    } catch {
      setRecording(false);
      setFeedback('Could not start microphone.');
    }
  }, [handleResult]);

  const stop = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  React.useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  if (supported === false) return null;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={recording ? 'default' : 'outline'}
        size="sm"
        onClick={recording ? stop : start}
        className={cn('w-full gap-2', recording && 'bg-destructive hover:bg-destructive/90')}
      >
        {recording ? (
          <>
            <MicOff className="size-4" />
            Stop &amp; parse
          </>
        ) : (
          <>
            <Mic className="size-4" />
            Speak instead — &quot;Orchard to Changi&quot;
          </>
        )}
      </Button>
      {recording && interim && (
        <p className="px-1 text-xs italic text-muted-foreground">{interim}</p>
      )}
      {feedback && (
        <p className="px-1 text-xs text-amber-700 dark:text-amber-300">{feedback}</p>
      )}
    </div>
  );
}
