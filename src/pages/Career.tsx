import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, FileText, Lightbulb } from 'lucide-react';
import RealWorldWhy from '@/components/career/RealWorldWhy';
import ResumeBuilder from '@/components/career/ResumeBuilder';
import InternshipMatcher from '@/components/career/InternshipMatcher';

const Career = () => {
  const [activeTab, setActiveTab] = useState('resume');

  return (
    <div className="p-6 space-y-6 pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Career</h1>
        <p className="text-muted-foreground text-sm mt-1">Connect your learning to real-world opportunities</p>
      </motion.header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="resume" className="flex items-center gap-1 text-xs">
            <FileText className="w-4 h-4" />Resume
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-1 text-xs">
            <Briefcase className="w-4 h-4" />Jobs
          </TabsTrigger>
          <TabsTrigger value="why" className="flex items-center gap-1 text-xs">
            <Lightbulb className="w-4 h-4" />Why It Matters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resume" className="space-y-6"><ResumeBuilder /></TabsContent>
        <TabsContent value="jobs" className="space-y-6"><InternshipMatcher /></TabsContent>
        <TabsContent value="why" className="space-y-6"><RealWorldWhy /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Career;
