import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIToolLayout from './AIToolLayout';
import ImageUpload from './ImageUpload';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

interface BookScannerProps {
  onBack: () => void;
}

const BookScanner = ({ onBack }: BookScannerProps) => {
  const { toast } = useToast();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!imageBase64) {
      toast({
        title: 'Missing image',
        description: 'Please upload a photo of a textbook page.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult('');

    await streamAIChat({
      messages: [],
      mode: 'book_scanner',
      imageBase64,
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
      title="Book Scanner"
      description="Extract definitions from textbook pages"
      icon={<BookOpen className="w-5 h-5 text-primary" />}
      onBack={onBack}
      result={result}
      loading={loading}
    >
      <ImageUpload onImageSelect={setImageBase64} disabled={loading} />

      <Button
        onClick={handleScan}
        disabled={loading || !imageBase64}
        className="w-full gradient-primary text-primary-foreground"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        Extract & Organize
      </Button>
    </AIToolLayout>
  );
};

export default BookScanner;
