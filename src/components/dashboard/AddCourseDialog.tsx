import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const COURSE_COLORS = [
  '#8B5CF6', // Purple
  '#0EA5E9', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

const COURSE_ICONS = [
  '📚', '📐', '🔬', '🧬', '💻', '🎨', '🎵', '🌍',
  '📊', '🧮', '✏️', '📝', '🔢', '🌐', '🧪', '⚡',
];

interface AddCourseDialogProps {
  onAdd: (name: string, color: string, icon: string) => void;
}

const AddCourseDialog = ({ onAdd }: AddCourseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COURSE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(COURSE_ICONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), selectedColor, selectedIcon);
      setName('');
      setSelectedColor(COURSE_COLORS[0]);
      setSelectedIcon(COURSE_ICONS[0]);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-5 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center gap-3 min-h-[160px]"
        >
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Add Course</span>
        </motion.button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add New Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Course Name */}
          <div>
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              placeholder="e.g., Computer Science 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <Label>Choose Icon</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {COURSE_ICONS.map((icon) => (
                <motion.button
                  key={icon}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    selectedIcon === icon
                      ? 'bg-primary/20 ring-2 ring-primary'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <Label>Choose Color</Label>
            <div className="flex gap-2 mt-2">
              {COURSE_COLORS.map((color) => (
                <motion.button
                  key={color}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-primary'
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${selectedColor}20` }}
              >
                {selectedIcon}
              </div>
              <span className="font-display font-semibold">
                {name || 'Course Name'}
              </span>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!name.trim()}
            className="w-full gradient-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseDialog;