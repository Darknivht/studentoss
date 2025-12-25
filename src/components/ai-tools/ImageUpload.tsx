import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  disabled?: boolean;
}

const ImageUpload = ({ onImageSelect, disabled }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreview(result);
        const base64 = result.split(',')[1];
        onImageSelect(base64);
      };
      reader.readAsDataURL(file);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {!preview ? (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <>
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Take Photo or Upload Image</p>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, HEIC</p>
              </div>
            </>
          )}
        </motion.button>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={preview} alt="Preview" className="w-full h-48 object-contain bg-muted" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={clearImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
