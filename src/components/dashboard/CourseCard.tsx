import { motion } from 'framer-motion';
import { MoreVertical, Trash2, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CourseCardProps {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
  onDelete: (id: string) => void;
  onClick: () => void;
  index: number;
}

const CourseCard = ({ id, name, icon, color, progress, onDelete, onClick, index }: CourseCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <div 
        className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-elevated transition-all duration-300"
        style={{ 
          background: `linear-gradient(135deg, ${color}15 0%, transparent 100%)`,
          borderColor: `${color}30`,
        }}
      >
        {/* Menu button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <MoreVertical size={16} className="text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Icon */}
        <div 
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>

        {/* Name */}
        <h3 className="font-display font-semibold text-foreground mb-3 pr-6">
          {name}
        </h3>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Progress</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                    <Info size={12} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-xs">
                    <p>Notes (30%) + Quizzes (30%) + Flashcards (40%)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-medium" style={{ color }}>{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
            style={{ 
              ['--progress-background' as string]: `${color}20`,
              ['--progress-foreground' as string]: color,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;