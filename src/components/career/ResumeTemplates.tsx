export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  education: { school: string; degree: string; year: string; gpa: string }[];
  experience: { title: string; company: string; period: string; description: string }[];
  skills: { name: string; level: string }[];
  projects: { name: string; description: string; tech: string }[];
  certifications: { name: string; issuer: string; year: string }[];
  languages: { language: string; proficiency: string }[];
}

export const emptyResumeData: ResumeData = {
  name: '', email: '', phone: '', location: '', website: '', summary: '',
  education: [], experience: [], skills: [], projects: [], certifications: [], languages: [],
};

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  accent: string;
}

export const templates: TemplateInfo[] = [
  { id: 'classic', name: 'Classic', description: 'Traditional professional layout', accent: '#1a365d' },
  { id: 'modern', name: 'Modern', description: 'Clean with bold header', accent: '#2563eb' },
  { id: 'minimal', name: 'Minimal', description: 'Whitespace-focused elegance', accent: '#374151' },
  { id: 'creative', name: 'Creative', description: 'Colorful sidebar layout', accent: '#7c3aed' },
  { id: 'executive', name: 'Executive', description: 'Formal, serif typography', accent: '#1e3a5f' },
  { id: 'tech', name: 'Tech', description: 'Developer-friendly monospace', accent: '#059669' },
  { id: 'academic', name: 'Academic', description: 'Research & publications focus', accent: '#6b21a8' },
  { id: 'compact', name: 'Compact', description: 'Dense, two-column layout', accent: '#b45309' },
  { id: 'bold', name: 'Bold', description: 'Large headings, strong contrast', accent: '#dc2626' },
  { id: 'elegant', name: 'Elegant', description: 'Refined, subtle colors', accent: '#64748b' },
];

const sectionHTML = (title: string, content: string, color: string) => content ? `
  <div style="margin-bottom:16px;">
    <h2 style="font-size:14px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${color};padding-bottom:4px;margin-bottom:8px;">${title}</h2>
    ${content}
  </div>` : '';

const skillsHTML = (skills: ResumeData['skills']) => skills.map(s =>
  `<span style="display:inline-block;padding:2px 10px;margin:2px;border-radius:12px;background:#f1f5f9;font-size:12px;">${s.name}${s.level ? ` · ${s.level}` : ''}</span>`
).join('');

const educationHTML = (edu: ResumeData['education']) => edu.map(e => `
  <div style="margin-bottom:8px;">
    <div style="display:flex;justify-content:space-between;"><strong>${e.degree}</strong><span style="color:#6b7280;font-size:12px;">${e.year}</span></div>
    <div style="color:#6b7280;font-size:13px;">${e.school}${e.gpa ? ` · GPA: ${e.gpa}` : ''}</div>
  </div>`).join('');

const experienceHTML = (exp: ResumeData['experience']) => exp.map(e => `
  <div style="margin-bottom:10px;">
    <div style="display:flex;justify-content:space-between;"><strong>${e.title}</strong><span style="color:#6b7280;font-size:12px;">${e.period}</span></div>
    <div style="color:#4b5563;font-size:13px;">${e.company}</div>
    <p style="font-size:13px;color:#374151;margin-top:4px;">${e.description}</p>
  </div>`).join('');

const projectsHTML = (proj: ResumeData['projects']) => proj.map(p => `
  <div style="margin-bottom:8px;">
    <strong>${p.name}</strong>${p.tech ? ` <span style="color:#6b7280;font-size:11px;">(${p.tech})</span>` : ''}
    <p style="font-size:13px;color:#374151;margin-top:2px;">${p.description}</p>
  </div>`).join('');

const certsHTML = (certs: ResumeData['certifications']) => certs.map(c =>
  `<div style="margin-bottom:4px;font-size:13px;"><strong>${c.name}</strong> — ${c.issuer} ${c.year ? `(${c.year})` : ''}</div>`
).join('');

const langsHTML = (langs: ResumeData['languages']) => langs.map(l =>
  `<span style="display:inline-block;margin-right:12px;font-size:13px;"><strong>${l.language}</strong> — ${l.proficiency}</span>`
).join('');

export function renderResumeHTML(data: ResumeData, templateId: string): string {
  const t = templates.find(t => t.id === templateId) || templates[0];
  const c = t.accent;

  const contactParts = [data.email, data.phone, data.location, data.website].filter(Boolean);
  const contactLine = contactParts.join(' · ');

  const body = `
    ${sectionHTML('Summary', data.summary ? `<p style="font-size:13px;color:#374151;line-height:1.5;">${data.summary}</p>` : '', c)}
    ${sectionHTML('Education', data.education.length ? educationHTML(data.education) : '', c)}
    ${sectionHTML('Experience', data.experience.length ? experienceHTML(data.experience) : '', c)}
    ${sectionHTML('Skills', data.skills.length ? `<div>${skillsHTML(data.skills)}</div>` : '', c)}
    ${sectionHTML('Projects', data.projects.length ? projectsHTML(data.projects) : '', c)}
    ${sectionHTML('Certifications', data.certifications.length ? certsHTML(data.certifications) : '', c)}
    ${sectionHTML('Languages', data.languages.length ? `<div>${langsHTML(data.languages)}</div>` : '', c)}
  `;

  if (templateId === 'creative' || templateId === 'compact') {
    // Two-column layout
    const leftContent = `
      ${sectionHTML('Skills', data.skills.length ? `<div>${skillsHTML(data.skills)}</div>` : '', '#fff')}
      ${sectionHTML('Languages', data.languages.length ? `<div>${langsHTML(data.languages)}</div>` : '', '#fff')}
      ${sectionHTML('Certifications', data.certifications.length ? certsHTML(data.certifications) : '', '#fff')}
    `;
    const rightContent = `
      ${sectionHTML('Summary', data.summary ? `<p style="font-size:13px;color:#374151;line-height:1.5;">${data.summary}</p>` : '', c)}
      ${sectionHTML('Experience', data.experience.length ? experienceHTML(data.experience) : '', c)}
      ${sectionHTML('Education', data.education.length ? educationHTML(data.education) : '', c)}
      ${sectionHTML('Projects', data.projects.length ? projectsHTML(data.projects) : '', c)}
    `;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;}</style></head><body>
      <div style="display:flex;min-height:100vh;">
        <div style="width:240px;background:${c};color:white;padding:32px 20px;">
          <h1 style="font-size:22px;font-weight:700;margin-bottom:4px;">${data.name || 'Your Name'}</h1>
          <div style="font-size:11px;opacity:0.85;margin-bottom:24px;">${contactParts.join('<br>')}</div>
          ${leftContent.replace(/#6b7280/g, '#e5e7eb').replace(/#374151/g, '#d1d5db').replace(/#f1f5f9/g, 'rgba(255,255,255,0.15)')}
        </div>
        <div style="flex:1;padding:32px 28px;">${rightContent}</div>
      </div>
    </body></html>`;
  }

  const headerStyles: Record<string, string> = {
    classic: `background:#fff;border-bottom:3px solid ${c};padding:28px 32px;`,
    modern: `background:${c};color:white;padding:28px 32px;`,
    minimal: `padding:32px;`,
    executive: `background:#fafafa;border-bottom:2px solid ${c};padding:28px 32px;font-family:Georgia,serif;`,
    tech: `background:#0f172a;color:#22d3ee;padding:28px 32px;font-family:'Courier New',monospace;`,
    academic: `border-bottom:1px solid #e5e7eb;padding:28px 32px;text-align:center;`,
    bold: `background:${c};color:white;padding:36px 32px;`,
    elegant: `padding:32px;border-bottom:1px solid #d1d5db;`,
  };

  const headerStyle = headerStyles[templateId] || headerStyles.classic;
  const nameColor = ['modern', 'tech', 'bold'].includes(templateId) ? 'white' : c;
  const contactColor = ['modern', 'tech', 'bold'].includes(templateId) ? 'rgba(255,255,255,0.8)' : '#6b7280';
  const fontFamily = templateId === 'executive' ? "Georgia, 'Times New Roman', serif" : templateId === 'tech' ? "'Courier New', monospace" : "'Segoe UI', Arial, sans-serif";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:${fontFamily};color:#1f2937;}</style></head><body>
    <div style="max-width:800px;margin:0 auto;">
      <div style="${headerStyle}">
        <h1 style="font-size:${templateId === 'bold' ? '28' : '22'}px;font-weight:700;color:${nameColor};margin-bottom:4px;">${data.name || 'Your Name'}</h1>
        <div style="font-size:13px;color:${contactColor};">${contactLine}</div>
      </div>
      <div style="padding:24px 32px;">${body}</div>
    </div>
  </body></html>`;
}
