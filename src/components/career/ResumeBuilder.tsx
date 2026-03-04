import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { streamAIChat } from '@/lib/ai';
import { FileText, Plus, Trash2, Download, Sparkles, Briefcase, Award, GraduationCap, Eye, Palette, Printer, FileDown, FileCode, Lock } from 'lucide-react';
import { templates, TemplateInfo, ResumeData, emptyResumeData, renderResumeHTML } from './ResumeTemplates';
import ResumePreview from './ResumePreview';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';
import { downloadHtmlAsPdf } from '@/components/export/ExportUtils';

// Moved OUTSIDE ResumeBuilder to prevent re-creation on every render
const InputRow = ({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} />
  </div>
);

const ResumeBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const [data, setData] = useState<ResumeData>({ ...emptyResumeData });
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [generating, setGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState('contact');
  const [showPreview, setShowPreview] = useState(false);
  const [showGate, setShowGate] = useState(false);

  const templateLimit = subscription.limits.resumeTemplatesLimit;

  useEffect(() => {
    if (user) fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data: courses } = await supabase.from('courses').select('name, progress').eq('user_id', user?.id).gte('progress', 50);
      const { data: profile } = await supabase.from('profiles').select('display_name, full_name').eq('user_id', user?.id).maybeSingle();

      if (courses) {
        const autoSkills = courses.map(c => ({
          name: c.name,
          level: (c.progress ?? 0) >= 90 ? 'Advanced' : (c.progress ?? 0) >= 70 ? 'Intermediate' : 'Beginner',
        }));
        setData(d => ({ ...d, skills: autoSkills }));
      }
      if (profile) {
        setData(d => ({ ...d, name: profile.full_name || profile.display_name || '' }));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const update = <K extends keyof ResumeData>(key: K, val: ResumeData[K]) => setData(d => ({ ...d, [key]: val }));

  const addItem = (key: 'education' | 'experience' | 'projects' | 'certifications' | 'languages' | 'skills') => {
    const defaults: Record<string, any> = {
      education: { school: '', degree: '', year: '', gpa: '' },
      experience: { title: '', company: '', period: '', description: '' },
      projects: { name: '', description: '', tech: '' },
      certifications: { name: '', issuer: '', year: '' },
      languages: { language: '', proficiency: '' },
      skills: { name: '', level: 'Beginner' },
    };
    setData(d => ({ ...d, [key]: [...d[key], defaults[key]] }));
  };

  const removeItem = (key: string, idx: number) => {
    setData(d => ({ ...d, [key]: (d as any)[key].filter((_: any, i: number) => i !== idx) }));
  };

  const updateItem = (key: string, idx: number, field: string, val: string) => {
    setData(d => {
      const arr = [...(d as any)[key]];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...d, [key]: arr };
    });
  };

  const generateSummary = async () => {
    if (data.skills.length === 0) { toast({ title: 'Add skills first', variant: 'destructive' }); return; }
    setGenerating(true);
    update('summary', '');
    const skillList = data.skills.map(s => `${s.name} (${s.level})`).join(', ');
    const expList = data.experience.map(e => `${e.title} at ${e.company}`).join(', ');
    const prompt = `Write a professional resume summary (2-3 sentences) for someone with skills: ${skillList}. ${expList ? `Experience: ${expList}.` : ''} Don't use "I". Be confident but not arrogant.`;
    try {
      await streamAIChat({
        messages: [{ role: 'user', content: prompt }],
        onDelta: (chunk) => setData(d => ({ ...d, summary: d.summary + chunk })),
        onDone: () => setGenerating(false),
        onError: (err) => { toast({ title: err, variant: 'destructive' }); setGenerating(false); },
      });
    } catch { setGenerating(false); }
  };

  const exportPDF = async () => {
    const html = renderResumeHTML(data, selectedTemplate);
    await downloadHtmlAsPdf(html, `${data.name || 'resume'}.pdf`);
    toast({ title: '📄 PDF downloaded!' });
  };

  const exportHTML = () => {
    const html = renderResumeHTML(data, selectedTemplate);
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${data.name || 'resume'}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: '📄 HTML exported!' });
  };

  const exportText = () => {
    const lines = [data.name, [data.email, data.phone, data.location, data.website].filter(Boolean).join(' | '), '',
      data.summary ? `SUMMARY\n${data.summary}\n` : '',
      data.education.length ? `EDUCATION\n${data.education.map(e => `${e.degree} — ${e.school} (${e.year})`).join('\n')}\n` : '',
      data.experience.length ? `EXPERIENCE\n${data.experience.map(e => `${e.title} at ${e.company} (${e.period})\n${e.description}`).join('\n\n')}\n` : '',
      data.skills.length ? `SKILLS\n${data.skills.map(s => `• ${s.name} — ${s.level}`).join('\n')}\n` : '',
      data.projects.length ? `PROJECTS\n${data.projects.map(p => `${p.name}${p.tech ? ` (${p.tech})` : ''}\n${p.description}`).join('\n\n')}\n` : '',
    ].filter(Boolean).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${data.name || 'resume'}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: '📄 Text exported!' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Template Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Palette className="w-5 h-5 text-primary" />Templates</h3>
          <Button size="sm" variant={showPreview ? 'default' : 'outline'} onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-4 h-4 mr-1" />{showPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {templates.map((t, idx) => {
            const isLocked = idx >= templateLimit;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (isLocked) {
                    setShowGate(true);
                  } else {
                    setSelectedTemplate(t.id);
                  }
                }}
                className={`relative flex flex-col items-center p-2 rounded-lg border transition-all ${
                  isLocked
                    ? 'border-border opacity-50 cursor-not-allowed'
                    : selectedTemplate === t.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40'
                }`}
              >
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg z-10">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="w-8 h-10 rounded border mb-1" style={{ borderColor: t.accent, background: `linear-gradient(135deg, ${t.accent}22, ${t.accent}08)` }}>
                  <div className="w-full h-2 rounded-t" style={{ background: t.accent }} />
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">{t.name}</span>
              </button>
            );
          })}
        </div>

        <FeatureGateDialog
          open={showGate}
          onOpenChange={setShowGate}
          feature="resume templates"
          currentUsage={templates.length}
          limit={templateLimit}
          requiredTier="plus"
        />
      </Card>

      {showPreview ? (
        <div className="space-y-3">
          <ResumePreview data={data} templateId={selectedTemplate} />
          <div className="flex gap-2">
            <Button onClick={exportPDF} className="flex-1"><Download className="w-4 h-4 mr-1" />Download PDF</Button>
            <Button onClick={exportHTML} variant="outline" className="flex-1"><FileCode className="w-4 h-4 mr-1" />HTML</Button>
            <Button onClick={exportText} variant="outline" className="flex-1"><FileDown className="w-4 h-4 mr-1" />Text</Button>
          </div>
        </div>
      ) : (
        <Card className="p-4">
          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
              <TabsTrigger value="edu" className="text-xs">Education</TabsTrigger>
              <TabsTrigger value="exp" className="text-xs">Experience</TabsTrigger>
              <TabsTrigger value="more" className="text-xs">More</TabsTrigger>
            </TabsList>

            <TabsContent value="contact" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InputRow label="Full Name" value={data.name} onChange={v => update('name', v)} placeholder="John Doe" />
                <InputRow label="Email" value={data.email} onChange={v => update('email', v)} placeholder="john@example.com" type="email" />
                <InputRow label="Phone" value={data.phone} onChange={v => update('phone', v)} placeholder="+1 234 567 8900" />
                <InputRow label="Location" value={data.location} onChange={v => update('location', v)} placeholder="City, Country" />
              </div>
              <InputRow label="Website / LinkedIn" value={data.website} onChange={v => update('website', v)} placeholder="linkedin.com/in/johndoe" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">Professional Summary</label>
                  <Button size="sm" variant="outline" onClick={generateSummary} disabled={generating}>
                    <Sparkles className="w-3 h-3 mr-1" />{generating ? '...' : 'AI'}
                  </Button>
                </div>
                <Textarea value={data.summary} onChange={e => update('summary', e.target.value)} placeholder="Brief professional summary..." rows={3} />
              </div>
            </TabsContent>

            <TabsContent value="edu" className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-1"><GraduationCap className="w-4 h-4" />Education</h4>
                <Button size="sm" variant="outline" onClick={() => addItem('education')}><Plus className="w-4 h-4" /></Button>
              </div>
              {data.education.map((e, i) => (
                <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-muted-foreground">#{i + 1}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeItem('education', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="School" value={e.school} onChange={ev => updateItem('education', i, 'school', ev.target.value)} />
                    <Input placeholder="Degree" value={e.degree} onChange={ev => updateItem('education', i, 'degree', ev.target.value)} />
                    <Input placeholder="Year" value={e.year} onChange={ev => updateItem('education', i, 'year', ev.target.value)} />
                    <Input placeholder="GPA (optional)" value={e.gpa} onChange={ev => updateItem('education', i, 'gpa', ev.target.value)} />
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="exp" className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-1"><Briefcase className="w-4 h-4" />Experience</h4>
                <Button size="sm" variant="outline" onClick={() => addItem('experience')}><Plus className="w-4 h-4" /></Button>
              </div>
              {data.experience.map((e, i) => (
                <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-muted-foreground">#{i + 1}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeItem('experience', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Job Title" value={e.title} onChange={ev => updateItem('experience', i, 'title', ev.target.value)} />
                    <Input placeholder="Company" value={e.company} onChange={ev => updateItem('experience', i, 'company', ev.target.value)} />
                    <Input placeholder="Period (e.g. 2023-Present)" value={e.period} onChange={ev => updateItem('experience', i, 'period', ev.target.value)} />
                  </div>
                  <Textarea placeholder="Description of responsibilities and achievements" value={e.description} onChange={ev => updateItem('experience', i, 'description', ev.target.value)} rows={2} />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="more" className="space-y-4">
              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-1"><Award className="w-4 h-4" />Skills</h4>
                  <Button size="sm" variant="outline" onClick={() => addItem('skills')}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-2">
                  {data.skills.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input placeholder="Skill" value={s.name} onChange={e => updateItem('skills', i, 'name', e.target.value)} className="flex-1" />
                      <select value={s.level} onChange={e => updateItem('skills', i, 'level', e.target.value)} className="px-2 py-2 bg-background border border-input rounded-md text-xs">
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeItem('skills', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Projects</h4>
                  <Button size="sm" variant="outline" onClick={() => addItem('projects')}><Plus className="w-4 h-4" /></Button>
                </div>
                {data.projects.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-2 mb-2">
                    <div className="flex justify-end"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeItem('projects', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button></div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Project Name" value={p.name} onChange={e => updateItem('projects', i, 'name', e.target.value)} />
                      <Input placeholder="Technologies" value={p.tech} onChange={e => updateItem('projects', i, 'tech', e.target.value)} />
                    </div>
                    <Textarea placeholder="Description" value={p.description} onChange={e => updateItem('projects', i, 'description', e.target.value)} rows={2} />
                  </div>
                ))}
              </div>

              {/* Certifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Certifications</h4>
                  <Button size="sm" variant="outline" onClick={() => addItem('certifications')}><Plus className="w-4 h-4" /></Button>
                </div>
                {data.certifications.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <Input placeholder="Name" value={c.name} onChange={e => updateItem('certifications', i, 'name', e.target.value)} className="flex-1" />
                    <Input placeholder="Issuer" value={c.issuer} onChange={e => updateItem('certifications', i, 'issuer', e.target.value)} className="flex-1" />
                    <Input placeholder="Year" value={c.year} onChange={e => updateItem('certifications', i, 'year', e.target.value)} className="w-20" />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeItem('certifications', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>

              {/* Languages */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Languages</h4>
                  <Button size="sm" variant="outline" onClick={() => addItem('languages')}><Plus className="w-4 h-4" /></Button>
                </div>
                {data.languages.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <Input placeholder="Language" value={l.language} onChange={e => updateItem('languages', i, 'language', e.target.value)} className="flex-1" />
                    <select value={l.proficiency} onChange={e => updateItem('languages', i, 'proficiency', e.target.value)} className="px-2 py-2 bg-background border border-input rounded-md text-xs">
                      <option value="Native">Native</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Basic">Basic</option>
                    </select>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeItem('languages', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Export buttons when in edit mode */}
      {!showPreview && (
        <div className="flex gap-2">
          <Button onClick={exportPDF} className="flex-1 gradient-primary text-primary-foreground"><Printer className="w-4 h-4 mr-1" />Print PDF</Button>
          <Button onClick={exportHTML} variant="outline"><FileCode className="w-4 h-4" /></Button>
          <Button onClick={exportText} variant="outline"><FileDown className="w-4 h-4" /></Button>
        </div>
      )}
    </motion.div>
  );
};

export default ResumeBuilder;
