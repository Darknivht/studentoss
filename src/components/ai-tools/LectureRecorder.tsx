import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIToolLayout from './AIToolLayout';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

interface LectureRecorderProps {
  onBack: () => void;
}

const LectureRecorder = ({ onBack }: LectureRecorderProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start speech recognition if available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript + ' ';
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          setTranscript(prev => prev + finalTranscript);
        };

        recognition.onerror = (event: any) => {
          console.log('Speech recognition error:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not access microphone. Please allow microphone access.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOrganize = async () => {
    if (!transcript.trim()) {
      toast({
        title: 'No transcript',
        description: 'Please record a lecture first.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult('');

    await streamAIChat({
      messages: [],
      mode: 'transcribe_audio',
      content: transcript,
      onDelta: (chunk) => setResult((prev) => prev + chunk),
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  return (
    <AIToolLayout
      title="Live Lecture Recorder"
      description="Audio recording with transcription"
      icon={<Mic className="w-5 h-5 text-primary" />}
      onBack={onBack}
      result={result}
      loading={loading}
    >
      <div className="flex flex-col items-center gap-4 py-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
          isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-primary/10'
        }`}>
          <Mic className={`w-10 h-10 ${isRecording ? 'text-red-500' : 'text-primary'}`} />
        </div>

        <p className="text-2xl font-mono font-bold text-foreground">
          {formatTime(recordingTime)}
        </p>

        {!isRecording ? (
          <Button onClick={startRecording} size="lg" className="gradient-primary text-primary-foreground">
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button onClick={stopRecording} size="lg" variant="destructive">
            <Square className="w-5 h-5 mr-2" />
            Stop Recording
          </Button>
        )}
      </div>

      {transcript && (
        <div className="rounded-xl bg-muted p-4">
          <h3 className="font-medium text-sm mb-2">Live Transcript</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {transcript || 'Listening...'}
          </p>
        </div>
      )}

      {audioUrl && (
        <div className="space-y-3">
          <audio controls src={audioUrl} className="w-full" />
          <Button
            onClick={handleOrganize}
            disabled={loading || !transcript.trim()}
            className="w-full gradient-primary text-primary-foreground"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mic className="w-4 h-4 mr-2" />
            )}
            Organize into Notes
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        💡 Speech recognition works best in Chrome. Recording continues even if transcription pauses.
      </p>
    </AIToolLayout>
  );
};

export default LectureRecorder;
