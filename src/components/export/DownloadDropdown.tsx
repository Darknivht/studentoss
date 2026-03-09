import { Download, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DownloadDropdownProps {
  onFast: () => void;
  onHQ: () => void;
  size?: 'sm' | 'default' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
  className?: string;
  iconOnly?: boolean;
}

const DownloadDropdown = ({ onFast, onHQ, size = 'sm', variant = 'ghost', className = 'h-7', iconOnly = true }: DownloadDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} className={className}>
          <Download className="w-3 h-3" />
          {!iconOnly && <span className="ml-1">Download</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onFast} className="gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <div>
            <div className="font-medium text-sm">Fast PDF</div>
            <div className="text-xs text-muted-foreground">Instant via print</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onHQ} className="gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <div>
            <div className="font-medium text-sm">HD PDF</div>
            <div className="text-xs text-muted-foreground">High quality, slower</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DownloadDropdown;
