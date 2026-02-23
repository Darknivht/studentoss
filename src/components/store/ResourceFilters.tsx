import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ResourceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  subject: string;
  onSubjectChange: (value: string) => void;
  gradeLevel: string;
  onGradeLevelChange: (value: string) => void;
  subjects: string[];
  grades: string[];
}

export const ResourceFilters = ({
  search, onSearchChange,
  category, onCategoryChange,
  subject, onSubjectChange,
  gradeLevel, onGradeLevelChange,
  subjects, grades,
}: ResourceFiltersProps) => {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[130px] h-8 text-xs shrink-0">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="textbook">Textbooks</SelectItem>
            <SelectItem value="book">Books</SelectItem>
            <SelectItem value="past_paper">Past Papers</SelectItem>
          </SelectContent>
        </Select>

        <Select value={subject} onValueChange={onSubjectChange}>
          <SelectTrigger className="w-[130px] h-8 text-xs shrink-0">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={gradeLevel} onValueChange={onGradeLevelChange}>
          <SelectTrigger className="w-[130px] h-8 text-xs shrink-0">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map(g => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
