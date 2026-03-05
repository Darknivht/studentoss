import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, Plus, Trash2, Edit, Loader2, LogOut, Megaphone, Trophy, Users, BarChart3, CreditCard, Search, BookOpen, Upload, Eye, Ban, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const AdminResources = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [verifying, setVerifying] = useState(false);
  const [adminPassword, setAdminPassword] = useState(() => {
    return sessionStorage.getItem('admin_password') || "";
  });

  const verify = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-verify', { body: { password } });
      if (error) throw error;
      if (data?.valid) {
        setAuthenticated(true);
        setAdminPassword(password);
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_password', password);
      } else {
        toast({ title: "Invalid password", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setAdminPassword("");
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_password');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="password" placeholder="Enter admin password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verify()} />
            <Button onClick={verify} disabled={verifying} className="w-full">
              {verifying && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Verify
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg sm:text-2xl font-bold">Admin Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </Button>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <div className="overflow-x-auto -mx-2 px-2 pb-1">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-7 gap-0.5">
            <TabsTrigger value="analytics" className="text-xs whitespace-nowrap px-2 sm:px-3"><BarChart3 className="w-3 h-3 mr-1 hidden sm:inline" />Analytics</TabsTrigger>
            <TabsTrigger value="resources" className="text-xs whitespace-nowrap px-2 sm:px-3"><Plus className="w-3 h-3 mr-1 hidden sm:inline" />Resources</TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs whitespace-nowrap px-2 sm:px-3"><Megaphone className="w-3 h-3 mr-1 hidden sm:inline" />Announce</TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs whitespace-nowrap px-2 sm:px-3"><Trophy className="w-3 h-3 mr-1 hidden sm:inline" />Achieve</TabsTrigger>
            <TabsTrigger value="users" className="text-xs whitespace-nowrap px-2 sm:px-3"><Users className="w-3 h-3 mr-1 hidden sm:inline" />Users</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs whitespace-nowrap px-2 sm:px-3"><CreditCard className="w-3 h-3 mr-1 hidden sm:inline" />Payments</TabsTrigger>
            <TabsTrigger value="exams" className="text-xs whitespace-nowrap px-2 sm:px-3"><BookOpen className="w-3 h-3 mr-1 hidden sm:inline" />Exams</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analytics"><AnalyticsTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="resources"><ResourcesTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="announcements"><AnnouncementsTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="achievements"><AchievementsTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="users"><UsersTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="payments"><PaymentsTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="exams"><ExamsTab adminPassword={adminPassword} /></TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Analytics Tab ───
const AnalyticsTab = ({ adminPassword }: { adminPassword: string }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'analytics' } });
    if (!error && data) setStats(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const summaryItems = stats ? [
    { label: "Total Users", value: stats.total_users, icon: "👥" },
    { label: "Active Today", value: stats.active_today, icon: "🟢" },
    { label: "Total Resources", value: stats.total_resources, icon: "📚" },
    { label: "Quiz Attempts", value: stats.total_quizzes, icon: "📝" },
    { label: "Plus Subscribers", value: stats.plus_subscribers, icon: "⭐" },
    { label: "Pro Subscribers", value: stats.pro_subscribers, icon: "💎" },
    { label: "Exam Attempts", value: stats.total_exam_attempts, icon: "🎯" },
    { label: "Total Notes", value: stats.total_notes, icon: "📒" },
    { label: "Study Hours", value: stats.total_study_hours, icon: "⏱️" },
    { label: "Avg Streak", value: stats.avg_streak, icon: "🔥" },
    { label: "Focus Sessions", value: stats.total_focus_sessions, icon: "🎧" },
    { label: "Pomodoro Sessions", value: stats.total_pomodoro_sessions, icon: "🍅" },
  ] : [];

  const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7']; // Green Free, Blue Plus, Purple Pro

  const estimatedRevenue = stats ? ((stats.plus_subscribers || 0) * 2000) + ((stats.pro_subscribers || 0) * 5000) : 0;

  const exportCSV = () => {
    if (!stats) return;
    const rows = [
      ['Metric', 'Value'],
      ...summaryItems.map(i => [i.label, String(i.value ?? 0)]),
      ['Est. Monthly Revenue (₦)', String(estimatedRevenue)],
      ['Weekly Retention (%)', String(stats.retention_rate ?? 0)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {summaryItems.map(i => (
              <Card key={i.label}>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl mb-0.5">{i.icon}</p>
                  <p className="text-xl font-bold">{i.value ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{i.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue & Retention Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Revenue Estimator */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-1"><CardTitle className="text-sm">Est. Monthly Revenue</CardTitle></CardHeader>
              <CardContent className="text-center">
                <p className="text-3xl font-bold text-primary">₦{estimatedRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.plus_subscribers || 0} Plus × ₦2k + {stats.pro_subscribers || 0} Pro × ₦5k</p>
              </CardContent>
            </Card>

            {/* Retention Card */}
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm">Weekly Retention</CardTitle></CardHeader>
              <CardContent className="text-center">
                <p className="text-3xl font-bold text-primary">{stats.retention_rate ?? 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.retention_retained ?? 0} retained / {stats.retention_last_week ?? 0} last wk
                </p>
              </CardContent>
            </Card>

            {/* Tier Distribution Pie */}
            {stats.tier_distribution?.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-1"><CardTitle className="text-sm">Subscription Tiers</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={stats.tier_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`} labelLine={true}>
                        {stats.tier_distribution.map((_: any, i: number) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [`${value} users`, name]} />
                      <Legend formatter={(value: string) => <span className="text-xs">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Top Active Students */}
          {stats.top_users?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Top Students This Week</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {stats.top_users.map((u: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="truncate max-w-[60%]">{i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {u.name}</span>
                    <Badge variant="outline" className="text-xs">{u.xp} XP</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Daily Active Users Chart */}
          {stats.daily_active_users?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Daily Active Users (30 days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={stats.daily_active_users}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Active Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Study Time Trend */}
          {stats.daily_study_minutes?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Daily Study Minutes (30 days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={stats.daily_study_minutes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="minutes" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.2} name="Minutes" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Daily Signups Chart */}
          {stats.daily_signups?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Daily Signups (30 days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={stats.daily_signups}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Signups" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* AI Usage Trend */}
          {stats.daily_ai_usage?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">AI Usage Trend (30 days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.daily_ai_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="AI Calls" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Feature Usage Chart */}
          {stats.daily_feature_usage?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Feature Usage (30 days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.daily_feature_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quizzes" fill="hsl(var(--primary))" name="Quizzes" />
                    <Bar dataKey="exams" fill="hsl(var(--secondary))" name="Exams" />
                    <Bar dataKey="flashcards" fill="hsl(var(--accent))" name="Flashcards" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}><Loader2 className="w-3 h-3 mr-1" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportCSV}><BarChart3 className="w-3 h-3 mr-1" />Export CSV</Button>
          </div>
        </>
      ) : null}
    </div>
  );
};

// ─── Resources Tab (existing logic, preserved) ───
const ResourcesTab = ({ adminPassword }: { adminPassword: string }) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "textbook", subject: "", grade_level: "", author: "", youtube_url: "", thumbnail_url: "", is_free: true, required_tier: "free" });

  const fetchResources = async () => {
    setLoading(true);
    const { data } = await supabase.from('store_resources' as any).select('*').order('created_at', { ascending: false });
    if (data) setResources(data as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchResources(); }, []);

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    const filePath = `resources/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('store-resources').upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('store-resources').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!form.title || !form.subject || !form.grade_level) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      let fileUrl = null;
      if (file) fileUrl = await uploadFile();
      const resource: any = { ...form };
      if (fileUrl) resource.file_url = fileUrl;
      if (!resource.youtube_url) delete resource.youtube_url;
      if (!resource.thumbnail_url) delete resource.thumbnail_url;
      await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: editingId ? 'update' : 'create', resource, resourceId: editingId } });
      toast({ title: editingId ? "Updated" : "Added" });
      resetForm();
      fetchResources();
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'delete', resourceId: id } });
    toast({ title: "Deleted" });
    fetchResources();
  };

  const handleEdit = (r: any) => {
    setEditingId(r.id);
    setForm({ title: r.title, description: r.description || "", category: r.category, subject: r.subject, grade_level: r.grade_level, author: r.author || "", youtube_url: r.youtube_url || "", thumbnail_url: r.thumbnail_url || "", is_free: r.is_free, required_tier: r.required_tier });
  };

  const resetForm = () => { setEditingId(null); setFile(null); setForm({ title: "", description: "", category: "textbook", subject: "", grade_level: "", author: "", youtube_url: "", thumbnail_url: "", is_free: true, required_tier: "free" }); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Resource" : "Add Resource"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))} /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="textbook">Textbook</SelectItem><SelectItem value="book">Book</SelectItem><SelectItem value="past_paper">Past Paper</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent></Select>
            </div>
            <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div><Label>Grade Level *</Label><Input value={form.grade_level} onChange={(e) => setForm(f => ({ ...f, grade_level: e.target.value }))} /></div>
            <div><Label>Required Tier</Label>
              <Select value={form.required_tier} onValueChange={(v) => setForm(f => ({ ...f, required_tier: v, is_free: v === 'free' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="plus">Plus</SelectItem><SelectItem value="pro">Pro</SelectItem></SelectContent></Select>
            </div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>YouTube URL</Label><Input value={form.youtube_url} onChange={(e) => setForm(f => ({ ...f, youtube_url: e.target.value }))} /></div>
            <div><Label>Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={(e) => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} /></div>
          </div>
          <div><Label>Upload File</Label><Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? "Update" : "Add"}</Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">All Resources ({resources.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Subject</TableHead><TableHead>Grade</TableHead><TableHead>Tier</TableHead><TableHead>DLs</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {resources.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-xs">{r.category}</Badge></TableCell>
                      <TableCell className="text-sm">{r.subject}</TableCell>
                      <TableCell className="text-sm">{r.grade_level}</TableCell>
                      <TableCell><Badge className="capitalize text-xs">{r.required_tier}</Badge></TableCell>
                      <TableCell className="text-sm">{r.download_count}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(r)}><Edit className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Announcements Tab ───
const AnnouncementsTab = ({ adminPassword }: { adminPassword: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", type: "info", is_active: true, expires_at: "" });

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'list-announcements' } });
    if (data?.data) setItems(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.content) { toast({ title: "Title and content required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const announcement: any = { ...form };
      if (!announcement.expires_at) delete announcement.expires_at;
      else announcement.expires_at = new Date(announcement.expires_at).toISOString();
      await supabase.functions.invoke('admin-resources', {
        body: { password: adminPassword, action: editingId ? 'update-announcement' : 'create-announcement', announcement, announcementId: editingId },
      });
      toast({ title: editingId ? "Updated" : "Created" });
      setEditingId(null);
      setForm({ title: "", content: "", type: "info", is_active: true, expires_at: "" });
      fetchAll();
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'delete-announcement', announcementId: id } });
    fetchAll();
  };

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    setForm({ title: a.title, content: a.content, type: a.type, is_active: a.is_active, expires_at: a.expires_at ? a.expires_at.split('T')[0] : "" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Announcement" : "New Announcement"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="promo">Promo</SelectItem></SelectContent></Select>
            </div>
            <div><Label>Expires At</Label><Input type="date" value={form.expires_at} onChange={(e) => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
          </div>
          <div><Label>Content *</Label><Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} rows={3} /></div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? "Update" : "Create"}</Button>
            {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm({ title: "", content: "", type: "info", is_active: true, expires_at: "" }); }}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">All Announcements ({items.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <div className="space-y-2">
              {items.map(a => (
                <div key={a.id} className="flex items-start justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{a.title}</p>
                      <Badge variant={a.is_active ? "default" : "secondary"} className="text-xs">{a.is_active ? "Active" : "Inactive"}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{a.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(a)}><Edit className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-muted-foreground py-4">No announcements yet</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Achievements Tab ───
const AchievementsTab = ({ adminPassword }: { adminPassword: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ id: "", name: "", description: "", icon: "🏆", requirement_type: "notes_count", requirement_value: 1, xp_reward: 50 });

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'list-achievements' } });
    if (data?.data) setItems(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async () => {
    if (!form.id || !form.name) { toast({ title: "ID and name required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const achievement = { ...form };
      await supabase.functions.invoke('admin-resources', {
        body: { password: adminPassword, action: editingId ? 'update-achievement' : 'create-achievement', achievement, achievementId: editingId },
      });
      toast({ title: editingId ? "Updated" : "Created" });
      setEditingId(null);
      setForm({ id: "", name: "", description: "", icon: "🏆", requirement_type: "notes_count", requirement_value: 1, xp_reward: 50 });
      fetchAll();
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'delete-achievement', achievementId: id } });
    fetchAll();
  };

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    setForm({ id: a.id, name: a.name, description: a.description, icon: a.icon, requirement_type: a.requirement_type, requirement_value: a.requirement_value, xp_reward: a.xp_reward });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Achievement" : "Add Achievement"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>ID *</Label><Input value={form.id} onChange={(e) => setForm(f => ({ ...f, id: e.target.value }))} disabled={!!editingId} placeholder="e.g. study_marathon" /></div>
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Icon (emoji)</Label><Input value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} /></div>
            <div><Label>Requirement Type</Label>
              <Select value={form.requirement_type} onValueChange={(val) => setForm(f => ({ ...f, requirement_type: val }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="notes_count">Notes Count</SelectItem>
                  <SelectItem value="quizzes_count">Quizzes Count</SelectItem>
                  <SelectItem value="flashcards_reviewed">Flashcards Reviewed</SelectItem>
                  <SelectItem value="streak">Streak</SelectItem>
                  <SelectItem value="focus_sessions">Focus Sessions</SelectItem>
                  <SelectItem value="total_xp">Total XP</SelectItem>
                  <SelectItem value="groups_joined">Groups Joined</SelectItem>
                  <SelectItem value="messages_sent">Messages Sent</SelectItem>
                  <SelectItem value="challenges_sent">Challenges Sent</SelectItem>
                  <SelectItem value="perfect_quizzes">Perfect Quizzes</SelectItem>
                  <SelectItem value="study_minutes">Study Minutes</SelectItem>
                  <SelectItem value="subjects_with_notes">Subjects With Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Requirement Value</Label><Input type="number" value={form.requirement_value} onChange={(e) => setForm(f => ({ ...f, requirement_value: Number(e.target.value) }))} /></div>
            <div><Label>XP Reward</Label><Input type="number" value={form.xp_reward} onChange={(e) => setForm(f => ({ ...f, xp_reward: Number(e.target.value) }))} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? "Update" : "Add"}</Button>
            {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm({ id: "", name: "", description: "", icon: "🏆", requirement_type: "notes_count", requirement_value: 1, xp_reward: 50 }); }}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">All Achievements ({items.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Icon</TableHead><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>XP</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{a.icon}</TableCell>
                      <TableCell className="text-xs font-mono">{a.id}</TableCell>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-xs">{a.requirement_type}</TableCell>
                      <TableCell>{a.requirement_value}</TableCell>
                      <TableCell>{a.xp_reward}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(a)}><Edit className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Users Tab ───
const UsersTab = ({ adminPassword }: { adminPassword: string }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [blocking, setBlocking] = useState<string | null>(null);

  const fetchUsers = async (q?: string) => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'list-users', search: q || "" } });
    if (data?.data) setUsers(data.data);
    setLoading(false);
  };

  const fetchUserDetail = async (userId: string) => {
    setDetailLoading(true);
    const { data } = await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'user-detail', userId } });
    if (data) setUserDetail(data);
    setDetailLoading(false);
  };

  const toggleBlock = async (userId: string, currentBlocked: boolean) => {
    setBlocking(userId);
    await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'toggle-block-user', userId, is_blocked: !currentBlocked } });
    toast({ title: currentBlocked ? "User unblocked" : "User blocked" });
    fetchUsers(search);
    if (userDetail?.profile?.user_id === userId) {
      setUserDetail((d: any) => d ? { ...d, profile: { ...d.profile, is_blocked: !currentBlocked } } : d);
    }
    setBlocking(null);
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Search by username or name..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers(search)} />
        <Button onClick={() => fetchUsers(search)}><Search className="w-4 h-4" /></Button>
      </div>
      <Card>
        <CardContent className="pt-4">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Tier</TableHead><TableHead>XP</TableHead><TableHead>Streak</TableHead><TableHead>Status</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || u.display_name || "—"}</TableCell>
                      <TableCell className="text-sm">{u.username || "—"}</TableCell>
                      <TableCell><Badge className="capitalize text-xs">{u.subscription_tier || "free"}</Badge></TableCell>
                      <TableCell>{u.total_xp || 0}</TableCell>
                      <TableCell>{u.current_streak || 0}🔥</TableCell>
                      <TableCell>
                        {u.is_blocked ? <Badge variant="destructive" className="text-xs">Blocked</Badge> : <Badge variant="outline" className="text-xs">Active</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelectedUser(u); fetchUserDetail(u.user_id); }}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={blocking === u.user_id} onClick={() => toggleBlock(u.user_id, !!u.is_blocked)}>
                            {u.is_blocked ? <ShieldCheck className="w-3 h-3 text-green-600" /> : <Ban className="w-3 h-3 text-destructive" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {users.length === 0 && <p className="text-center text-muted-foreground py-4">No users found</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) { setSelectedUser(null); setUserDetail(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details: {selectedUser?.full_name || selectedUser?.username || "Unknown"}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : userDetail ? (
            <div className="space-y-4">
              {/* Profile Summary */}
              <Card>
                <CardContent className="pt-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Tier</span><Badge className="capitalize">{userDetail.profile?.subscription_tier || "free"}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">XP</span><span className="font-bold">{userDetail.profile?.total_xp || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Streak</span><span>{userDetail.profile?.current_streak || 0}🔥 (Best: {userDetail.profile?.longest_streak || 0})</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{userDetail.profile?.created_at ? new Date(userDetail.profile.created_at).toLocaleDateString() : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">AI Calls Today</span><span>{userDetail.profile?.ai_calls_today || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Subscription Expires</span><span>{userDetail.profile?.subscription_expires_at ? new Date(userDetail.profile.subscription_expires_at).toLocaleDateString() : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span>{userDetail.profile?.is_blocked ? <Badge variant="destructive">Blocked</Badge> : <Badge variant="outline">Active</Badge>}</div>
                </CardContent>
              </Card>

              {/* Activity Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card><CardContent className="pt-4 text-center"><p className="text-xl font-bold">{userDetail.exam?.total || 0}</p><p className="text-xs text-muted-foreground">Exam Attempts</p><p className="text-xs text-primary">{userDetail.exam?.accuracy || 0}% accuracy</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xl font-bold">{userDetail.quiz?.total || 0}</p><p className="text-xs text-muted-foreground">Quizzes Taken</p><p className="text-xs text-primary">{userDetail.quiz?.avg_score || 0}% avg score</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xl font-bold">{Math.round((userDetail.study?.total_minutes || 0) / 60)}h</p><p className="text-xs text-muted-foreground">Study Time</p><p className="text-xs text-primary">{userDetail.study?.sessions || 0} sessions</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xl font-bold">{userDetail.notes_count || 0}</p><p className="text-xs text-muted-foreground">Notes</p><p className="text-xs text-primary">{userDetail.flashcards_count || 0} flashcards</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xl font-bold">{userDetail.achievements_count || 0}</p><p className="text-xs text-muted-foreground">Achievements</p><p className="text-xs text-primary">🏆 unlocked</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xl font-bold">{Math.round(((userDetail.focus?.total_minutes || 0) + (userDetail.pomodoro?.total_minutes || 0)) / 60)}h</p><p className="text-xs text-muted-foreground">Focus Time</p><p className="text-xs text-primary">{(userDetail.focus?.sessions || 0) + (userDetail.pomodoro?.sessions || 0)} sessions</p></CardContent></Card>
              </div>

              {/* Weekly Study Trend */}
              {userDetail.weekly_study?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Study Trend (Last 7 Days)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={userDetail.weekly_study}>
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="Minutes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Subject Performance Breakdown */}
              {userDetail.subject_performance?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Subject Performance</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {userDetail.subject_performance.map((s: any) => (
                      <div key={s.subject_id} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[50%]">{s.subject_name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${s.accuracy}%` }} />
                          </div>
                          <span className="text-xs font-medium w-12 text-right">{s.accuracy}%</span>
                          <span className="text-xs text-muted-foreground">({s.total})</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Course Progress */}
              {userDetail.courses?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Courses ({userDetail.courses.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {userDetail.courses.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[50%]">{c.icon || '📚'} {c.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${c.progress || 0}%` }} />
                          </div>
                          <span className="text-xs font-medium w-10 text-right">{c.progress || 0}%</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity Timeline */}
              {userDetail.timeline?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {userDetail.timeline.map((t: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-base">{t.type === 'study' ? '📖' : t.type === 'quiz' ? '📝' : '🎯'}</span>
                        <div className="flex-1">
                          <p className="text-sm">{t.detail}</p>
                          <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : <p className="text-center text-muted-foreground py-4">No data available</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Payments Tab ───
const PaymentsTab = ({ adminPassword }: { adminPassword: string }) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [durations, setDurations] = useState<Record<string, string>>({});

  const fetchUsers = async () => {
    if (!search) return;
    setLoading(true);
    const { data } = await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'list-users', search } });
    if (data?.data) setUsers(data.data);
    setLoading(false);
  };

  const updateSub = async (userId: string, tier: string) => {
    setUpdating(userId);
    try {
      const duration = durations[userId] || 'monthly';
      let expiresAt: string | null = null;
      if (tier !== 'free') {
        if (duration === 'yearly') {
          expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      }
      await supabase.functions.invoke('admin-resources', {
        body: { password: adminPassword, action: 'update-subscription', userId, subscription_tier: tier, subscription_expires_at: expiresAt },
      });
      toast({ title: `Updated to ${tier} (${tier === 'free' ? 'no expiry' : duration})` });
      fetchUsers();
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">Payment Resolution</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Search for a user, then manually upgrade or downgrade their subscription with duration choice.</p>
          <div className="flex gap-2">
            <Input placeholder="Search by username or name..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()} />
            <Button onClick={fetchUsers}><Search className="w-4 h-4" /></Button>
          </div>
          {loading ? <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{u.full_name || u.display_name || u.username || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">Current: <Badge className="capitalize text-xs">{u.subscription_tier || "free"}</Badge>
                        {u.subscription_expires_at && <span className="ml-2">Expires: {new Date(u.subscription_expires_at).toLocaleDateString()}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={durations[u.user_id] || 'monthly'} onValueChange={(v) => setDurations(d => ({ ...d, [u.user_id]: v }))}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly (30d)</SelectItem>
                        <SelectItem value="yearly">Yearly (365d)</SelectItem>
                      </SelectContent>
                    </Select>
                    {['free', 'plus', 'pro'].map(tier => (
                      <Button key={tier} size="sm" variant={u.subscription_tier === tier ? "default" : "outline"} className="text-xs capitalize" disabled={updating === u.user_id} onClick={() => updateSub(u.user_id, tier)}>
                        {updating === u.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : tier}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Exams Tab ───
const ExamsTab = ({ adminPassword }: { adminPassword: string }) => {
  const [section, setSection] = useState<'types' | 'subjects' | 'topics' | 'questions' | 'pdf-import' | 'analytics'>('types');
  const [examAnalytics, setExamAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [questionSearch, setQuestionSearch] = useState("");
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selection state for cascading
  const [selectedExamType, setSelectedExamType] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Forms
  const [typeForm, setTypeForm] = useState({ name: "", slug: "", description: "", icon: "📝", country: "Nigeria", is_active: true, exam_mode: "per_subject", subjects_required: 1, time_limit_minutes: 60, questions_per_subject: 40, logo_url: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", icon: "📘", is_active: true, ai_prompt: "" });
  const [topicForm, setTopicForm] = useState({ name: "", description: "", difficulty: "medium", is_active: true });
  const [questionForm, setQuestionForm] = useState({ question: "", options: ["", "", "", ""], correct_index: 0, explanation: "", difficulty: "medium", year: "", source: "admin_added" });

  // Filters for questions
  const [qFilter, setQFilter] = useState({ difficulty: "", source: "" });

  const invoke = async (action: string, extra: any = {}) => {
    const { data, error } = await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action, ...extra } });
    if (error) throw error;
    return data;
  };

  const fetchExamTypes = async () => {
    setLoading(true);
    try {
      const res = await invoke('list-exam-types');
      setExamTypes(res.data || []);
    } catch { }
    setLoading(false);
  };

  const fetchSubjects = async (examTypeId: string) => {
    setLoading(true);
    try {
      const res = await invoke('list-exam-subjects', { examTypeId });
      setSubjects(res.data || []);
    } catch { }
    setLoading(false);
  };

  const fetchTopics = async (subjectId: string) => {
    setLoading(true);
    try {
      const res = await invoke('list-exam-topics', { subjectId });
      setTopics(res.data || []);
    } catch { }
    setLoading(false);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedExamType) filters.examTypeId = selectedExamType;
      if (selectedSubject) filters.subjectId = selectedSubject;
      if (selectedTopic) filters.topicId = selectedTopic;
      if (qFilter.difficulty) filters.difficulty = qFilter.difficulty;
      if (qFilter.source) filters.source = qFilter.source;
      const res = await invoke('list-exam-questions', filters);
      setQuestions(res.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchExamTypes(); }, []);
  useEffect(() => { if (selectedExamType) { fetchSubjects(selectedExamType); setSelectedSubject(""); setSelectedTopic(""); } }, [selectedExamType]);
  useEffect(() => { if (selectedSubject) { fetchTopics(selectedSubject); setSelectedTopic(""); } }, [selectedSubject]);
  // Auto-fetch questions when switching to questions section with a subject selected
  useEffect(() => { if (section === 'questions' && selectedSubject) { fetchQuestions(); } }, [section, selectedSubject, selectedTopic, qFilter.difficulty, qFilter.source]);

  // ─── Exam Types CRUD ───
  const handleTypeSubmit = async () => {
    if (!typeForm.name || !typeForm.slug) { toast({ title: "Name and slug required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      let logoUrl = typeForm.logo_url;
      if (logoFile) {
        const filePath = `exam-logos/${Date.now()}-${logoFile.name}`;
        const { error: uploadErr } = await supabase.storage.from('exam-pdfs').upload(filePath, logoFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('exam-pdfs').getPublicUrl(filePath);
        logoUrl = urlData.publicUrl;
      }
      const submitData = { ...typeForm, logo_url: logoUrl || null };
      await invoke(editingId ? 'update-exam-type' : 'create-exam-type', { examType: submitData, examTypeId: editingId });
      toast({ title: editingId ? "Updated" : "Created" });
      setEditingId(null);
      setLogoFile(null);
      setTypeForm({ name: "", slug: "", description: "", icon: "📝", country: "Nigeria", is_active: true, exam_mode: "per_subject", subjects_required: 1, time_limit_minutes: 60, questions_per_subject: 40, logo_url: "" });
      fetchExamTypes();
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleTypeDelete = async (id: string) => {
    if (!confirm("Delete this exam type? This will delete all related subjects, topics, and questions.")) return;
    try {
      await invoke('delete-exam-type', { examTypeId: id });
      toast({ title: "Deleted" });
      fetchExamTypes();
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
  };

  const handleTypeEdit = (t: any) => {
    setEditingId(t.id);
    setLogoFile(null);
    setTypeForm({ name: t.name, slug: t.slug, description: t.description || "", icon: t.icon || "📝", country: t.country || "Nigeria", is_active: t.is_active, exam_mode: t.exam_mode || "per_subject", subjects_required: t.subjects_required || 1, time_limit_minutes: t.time_limit_minutes || 60, questions_per_subject: t.questions_per_subject || 40, logo_url: t.logo_url || "" });
  };

  // ─── Subjects CRUD ───
  const handleSubjectSubmit = async () => {
    if (!subjectForm.name || !selectedExamType) { toast({ title: "Select exam type and enter name", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const subject = { ...subjectForm, exam_type_id: selectedExamType };
      await invoke(editingId ? 'update-exam-subject' : 'create-exam-subject', { subject, subjectId: editingId });
      toast({ title: editingId ? "Updated" : "Created" });
      setEditingId(null);
      setSubjectForm({ name: "", icon: "📘", is_active: true, ai_prompt: "" });
      fetchSubjects(selectedExamType);
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleSubjectDelete = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    try {
      await invoke('delete-exam-subject', { subjectId: id });
      fetchSubjects(selectedExamType);
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
  };

  const handleSubjectEdit = (s: any) => {
    setEditingId(s.id);
    setSubjectForm({ name: s.name, icon: s.icon || "📘", is_active: s.is_active, ai_prompt: s.ai_prompt || "" });
  };

  // ─── Topics CRUD ───
  const handleTopicSubmit = async () => {
    if (!topicForm.name || !selectedSubject) { toast({ title: "Select subject and enter name", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const topic = { ...topicForm, subject_id: selectedSubject };
      await invoke(editingId ? 'update-exam-topic' : 'create-exam-topic', { topic, topicId: editingId });
      toast({ title: editingId ? "Updated" : "Created" });
      setEditingId(null);
      setTopicForm({ name: "", description: "", difficulty: "medium", is_active: true });
      fetchTopics(selectedSubject);
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleTopicDelete = async (id: string) => {
    if (!confirm("Delete this topic?")) return;
    try {
      await invoke('delete-exam-topic', { topicId: id });
      fetchTopics(selectedSubject);
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
  };

  const handleTopicEdit = (t: any) => {
    setEditingId(t.id);
    setTopicForm({ name: t.name, description: t.description || "", difficulty: t.difficulty, is_active: t.is_active });
  };

  // ─── Questions CRUD ───
  const handleQuestionSubmit = async () => {
    if (!questionForm.question || !selectedExamType || !selectedSubject) { toast({ title: "Select exam/subject and enter question", variant: "destructive" }); return; }
    if (questionForm.options.some(o => !o.trim())) { toast({ title: "All 4 options required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const question = {
        ...questionForm,
        exam_type_id: selectedExamType,
        subject_id: selectedSubject,
        topic_id: selectedTopic || null,
        options: questionForm.options,
        year: questionForm.year || null,
      };
      await invoke(editingId ? 'update-exam-question' : 'create-exam-question', { question, questionId: editingId });
      toast({ title: editingId ? "Updated" : "Created" });
      setEditingId(null);
      setQuestionForm({ question: "", options: ["", "", "", ""], correct_index: 0, explanation: "", difficulty: "medium", year: "", source: "admin_added" });
      fetchQuestions();
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleQuestionDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await invoke('delete-exam-question', { questionId: id });
      fetchQuestions();
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
  };

  const handleQuestionEdit = (q: any) => {
    setEditingId(q.id);
    const opts = Array.isArray(q.options) ? q.options : ["", "", "", ""];
    setQuestionForm({ question: q.question, options: opts, correct_index: q.correct_index, explanation: q.explanation || "", difficulty: q.difficulty, year: q.year || "", source: q.source });
  };

  // ─── Bulk Import ───
  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(questions) || questions.length === 0) { toast({ title: "Invalid JSON format", variant: "destructive" }); return; }
      // Attach exam_type_id and subject_id if not present
      const enriched = questions.map((q: any) => ({
        ...q,
        exam_type_id: q.exam_type_id || selectedExamType,
        subject_id: q.subject_id || selectedSubject,
        topic_id: q.topic_id || selectedTopic || null,
        source: q.source || 'admin_added',
      }));
      setSubmitting(true);
      const res = await invoke('bulk-import-questions', { questions: enriched });
      toast({ title: `Imported ${res.count} questions` });
      fetchQuestions();
    } catch (err: any) { toast({ title: "Import failed", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); e.target.value = ""; }
  };

  const selectedExamTypeName = examTypes.find(t => t.id === selectedExamType)?.name || "";
  const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name || "";

  return (
    <div className="space-y-4">
      {/* Section Selector */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'types' as const, label: 'Exam Types', icon: '🎓' },
          { key: 'subjects' as const, label: 'Subjects', icon: '📘' },
          { key: 'topics' as const, label: 'Topics', icon: '📋' },
          { key: 'questions' as const, label: 'Questions', icon: '❓' },
          { key: 'pdf-import' as const, label: 'PDF Import', icon: '📄' },
          { key: 'analytics' as const, label: 'Analytics', icon: '📊' },
        ].map(s => (
          <Button key={s.key} size="sm" variant={section === s.key ? "default" : "outline"} onClick={() => { setSection(s.key); setEditingId(null); }}>
            {s.icon} {s.label}
          </Button>
        ))}
      </div>

      {/* Cascading Selectors */}
      {section !== 'types' && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Exam Type</Label>
                <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                  <SelectTrigger><SelectValue placeholder="Select exam..." /></SelectTrigger>
                  <SelectContent>
                    {examTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(section === 'topics' || section === 'questions' || section === 'pdf-import') && (
                <div>
                  <Label>Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedExamType}>
                    <SelectTrigger><SelectValue placeholder="Select subject..." /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {section === 'questions' && (
                <div>
                  <Label>Topic (optional)</Label>
                  <Select value={selectedTopic || "__all__"} onValueChange={(v) => setSelectedTopic(v === "__all__" ? "" : v)} disabled={!selectedSubject}>
                    <SelectTrigger><SelectValue placeholder="All topics" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All topics</SelectItem>
                      {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Exam Types Section ─── */}
      {section === 'types' && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Exam Type" : "Add Exam Type"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Name *</Label><Input value={typeForm.name} onChange={(e) => setTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. JAMB UTME" /></div>
                <div><Label>Slug *</Label><Input value={typeForm.slug} onChange={(e) => setTypeForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. jamb" /></div>
                <div><Label>Icon (emoji fallback)</Label><Input value={typeForm.icon} onChange={(e) => setTypeForm(f => ({ ...f, icon: e.target.value }))} /></div>
                <div><Label>Country</Label><Input value={typeForm.country} onChange={(e) => setTypeForm(f => ({ ...f, country: e.target.value }))} /></div>
                <div className="sm:col-span-2">
                  <Label>Logo Image (optional, overrides emoji)</Label>
                  <div className="flex items-center gap-3 mt-1">
                    {(typeForm.logo_url || logoFile) && (
                      <img src={logoFile ? URL.createObjectURL(logoFile) : typeForm.logo_url} alt="Logo preview" className="w-10 h-10 rounded-lg object-contain border" />
                    )}
                    <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
              </div>
              <div><Label>Description</Label><Textarea value={typeForm.description} onChange={(e) => setTypeForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Exam Mode</Label>
                  <Select value={typeForm.exam_mode} onValueChange={(v) => setTypeForm(f => ({ ...f, exam_mode: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_subject">Per Subject</SelectItem>
                      <SelectItem value="multi_subject">Multi-Subject CBT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {typeForm.exam_mode === 'multi_subject' && (
                  <>
                    <div><Label>Subjects Required</Label><Input type="number" value={typeForm.subjects_required} onChange={(e) => setTypeForm(f => ({ ...f, subjects_required: parseInt(e.target.value) || 1 }))} /></div>
                    <div><Label>Time Limit (min)</Label><Input type="number" value={typeForm.time_limit_minutes} onChange={(e) => setTypeForm(f => ({ ...f, time_limit_minutes: parseInt(e.target.value) || 60 }))} /></div>
                    <div><Label>Questions/Subject</Label><Input type="number" value={typeForm.questions_per_subject} onChange={(e) => setTypeForm(f => ({ ...f, questions_per_subject: parseInt(e.target.value) || 40 }))} /></div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2"><Switch checked={typeForm.is_active} onCheckedChange={(v) => setTypeForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
              <div className="flex gap-2">
                <Button onClick={handleTypeSubmit} disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? "Update" : "Add"}</Button>
                {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setLogoFile(null); setTypeForm({ name: "", slug: "", description: "", icon: "📝", country: "Nigeria", is_active: true, exam_mode: "per_subject", subjects_required: 1, time_limit_minutes: 60, questions_per_subject: 40, logo_url: "" }); }}>Cancel</Button>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">All Exam Types ({examTypes.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                <div className="space-y-2">
                  {examTypes.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.icon}</span>
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.slug} · {t.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={t.is_active ? "default" : "secondary"} className="text-xs">{t.is_active ? "Active" : "Inactive"}</Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleTypeEdit(t)}><Edit className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleTypeDelete(t.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                  {examTypes.length === 0 && <p className="text-center text-muted-foreground py-4">No exam types yet</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Subjects Section ─── */}
      {section === 'subjects' && (
        <>
          {!selectedExamType ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Select an exam type above to manage its subjects</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Subject" : `Add Subject to ${selectedExamTypeName}`}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Name *</Label><Input value={subjectForm.name} onChange={(e) => setSubjectForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mathematics" /></div>
                    <div><Label>Icon (emoji)</Label><Input value={subjectForm.icon} onChange={(e) => setSubjectForm(f => ({ ...f, icon: e.target.value }))} /></div>
                  </div>
                   <div className="flex items-center gap-2"><Switch checked={subjectForm.is_active} onCheckedChange={(v) => setSubjectForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
                   <div><Label>AI Teaching Prompt (optional)</Label><Textarea value={subjectForm.ai_prompt} onChange={(e) => setSubjectForm(f => ({ ...f, ai_prompt: e.target.value }))} rows={3} placeholder="e.g. You are Prof. Adeyemi, a WAEC Chemistry expert. Focus on practical applications, use Nigerian examples..." /></div>
                   <p className="text-xs text-muted-foreground">This prompt customizes how AI generates questions, explanations, and study plans for this subject. Leave empty for default behavior.</p>
                  <div className="flex gap-2">
                     <Button onClick={handleSubjectSubmit} disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? "Update" : "Add"}</Button>
                     {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setSubjectForm({ name: "", icon: "📘", is_active: true, ai_prompt: "" }); }}>Cancel</Button>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Subjects ({subjects.length})</CardTitle></CardHeader>
                <CardContent>
                  {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                    <div className="space-y-2">
                      {subjects.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{s.icon}</span>
                            <p className="font-medium">{s.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={s.is_active ? "default" : "secondary"} className="text-xs">{s.is_active ? "Active" : "Inactive"}</Badge>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSubjectEdit(s)}><Edit className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleSubjectDelete(s.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      ))}
                      {subjects.length === 0 && <p className="text-center text-muted-foreground py-4">No subjects yet</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* ─── Topics Section ─── */}
      {section === 'topics' && (
        <>
          {!selectedSubject ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Select an exam type and subject above to manage topics</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Topic" : `Add Topic to ${selectedSubjectName}`}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Name *</Label><Input value={topicForm.name} onChange={(e) => setTopicForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Organic Chemistry" /></div>
                    <div><Label>Difficulty</Label>
                      <Select value={topicForm.difficulty} onValueChange={(v) => setTopicForm(f => ({ ...f, difficulty: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Description</Label><Textarea value={topicForm.description} onChange={(e) => setTopicForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
                  <div className="flex items-center gap-2"><Switch checked={topicForm.is_active} onCheckedChange={(v) => setTopicForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
                  <div className="flex gap-2">
                    <Button onClick={handleTopicSubmit} disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? "Update" : "Add"}</Button>
                    {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setTopicForm({ name: "", description: "", difficulty: "medium", is_active: true }); }}>Cancel</Button>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Topics ({topics.length})</CardTitle></CardHeader>
                <CardContent>
                  {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                    <div className="space-y-2">
                      {topics.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{t.name}</p>
                            {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">{t.difficulty}</Badge>
                            <Badge variant={t.is_active ? "default" : "secondary"} className="text-xs">{t.is_active ? "Active" : "Inactive"}</Badge>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleTopicEdit(t)}><Edit className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleTopicDelete(t.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      ))}
                      {topics.length === 0 && <p className="text-center text-muted-foreground py-4">No topics yet</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* ─── Questions Section ─── */}
      {section === 'questions' && (
        <>
          {!selectedSubject ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Select an exam type and subject above to manage questions</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Question" : "Add Question"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label>Question *</Label><Textarea value={questionForm.question} onChange={(e) => setQuestionForm(f => ({ ...f, question: e.target.value }))} rows={3} placeholder="Enter the question text..." /></div>
                  <div className="space-y-2">
                    <Label>Options (4 required) *</Label>
                    {questionForm.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct"
                          checked={questionForm.correct_index === i}
                          onChange={() => setQuestionForm(f => ({ ...f, correct_index: i }))}
                          className="accent-primary"
                        />
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...questionForm.options];
                            newOpts[i] = e.target.value;
                            setQuestionForm(f => ({ ...f, options: newOpts }));
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
                  </div>
                  <div><Label>Explanation</Label><Textarea value={questionForm.explanation} onChange={(e) => setQuestionForm(f => ({ ...f, explanation: e.target.value }))} rows={2} placeholder="Why is this the correct answer?" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><Label>Difficulty</Label>
                      <Select value={questionForm.difficulty} onValueChange={(v) => setQuestionForm(f => ({ ...f, difficulty: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>Year</Label><Input value={questionForm.year} onChange={(e) => setQuestionForm(f => ({ ...f, year: e.target.value }))} placeholder="e.g. 2024" /></div>
                    <div><Label>Source</Label>
                      <Select value={questionForm.source} onValueChange={(v) => setQuestionForm(f => ({ ...f, source: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="admin_added">Admin Added</SelectItem><SelectItem value="past_question">Past Question</SelectItem><SelectItem value="ai_generated">AI Generated</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleQuestionSubmit} disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? "Update" : "Add"}</Button>
                    {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setQuestionForm({ question: "", options: ["", "", "", ""], correct_index: 0, explanation: "", difficulty: "medium", year: "", source: "admin_added" }); }}>Cancel</Button>}
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Import + Filters */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <Label>Bulk Import (JSON)</Label>
                      <Input type="file" accept=".json" onChange={handleBulkImport} disabled={submitting} />
                    </div>
                    <div>
                      <Label>Filter Difficulty</Label>
                      <Select value={qFilter.difficulty || "__all__"} onValueChange={(v) => setQFilter(f => ({ ...f, difficulty: v === "__all__" ? "" : v }))}>
                        <SelectTrigger className="w-32"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent><SelectItem value="__all__">All</SelectItem><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Filter Source</Label>
                      <Select value={qFilter.source || "__all__"} onValueChange={(v) => setQFilter(f => ({ ...f, source: v === "__all__" ? "" : v }))}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent><SelectItem value="__all__">All</SelectItem><SelectItem value="admin_added">Admin</SelectItem><SelectItem value="past_question">Past Q</SelectItem><SelectItem value="ai_generated">AI</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <Button onClick={fetchQuestions} size="sm"><Search className="w-3 h-3 mr-1" />Load</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Question Stats Header */}
              {questions.length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">Total: {questions.length}</span>
                      <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-600">Easy: {questions.filter(q => q.difficulty === 'easy').length}</span>
                      <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600">Medium: {questions.filter(q => q.difficulty === 'medium').length}</span>
                      <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-600">Hard: {questions.filter(q => q.difficulty === 'hard').length}</span>
                      {questions.filter(q => !q.explanation).length > 0 && (
                        <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive">⚠️ No explanation: {questions.filter(q => !q.explanation).length}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search & Bulk Actions */}
              {questions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Input placeholder="Search questions..." value={questionSearch} onChange={(e) => setQuestionSearch(e.target.value)} className="w-48 h-8 text-xs" />
                  {selectedQuestionIds.size > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">{selectedQuestionIds.size} selected</span>
                      <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={async () => {
                        if (!confirm(`Delete ${selectedQuestionIds.size} questions?`)) return;
                        for (const id of selectedQuestionIds) {
                          await invoke('delete-exam-question', { questionId: id }).catch(() => {});
                        }
                        setSelectedQuestionIds(new Set());
                        toast({ title: 'Deleted' });
                        fetchQuestions();
                      }}>Delete Selected</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedQuestionIds(new Set())}>Clear</Button>
                    </>
                  )}
                </div>
              )}

              <Card>
                <CardHeader><CardTitle className="text-lg">Questions ({questions.length})</CardTitle></CardHeader>
                <CardContent>
                  {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                    <div className="space-y-3">
                      {questions
                        .filter(q => !questionSearch || q.question.toLowerCase().includes(questionSearch.toLowerCase()))
                        .map(q => {
                        const opts = Array.isArray(q.options) ? q.options : [];
                        const isSelected = selectedQuestionIds.has(q.id);
                        return (
                          <div key={q.id} className={`p-3 rounded-lg border space-y-2 ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2 flex-1">
                                <input type="checkbox" checked={isSelected} onChange={(e) => {
                                  const newSet = new Set(selectedQuestionIds);
                                  if (e.target.checked) newSet.add(q.id); else newSet.delete(q.id);
                                  setSelectedQuestionIds(newSet);
                                }} className="mt-1 accent-primary" />
                                <p className="font-medium text-sm flex-1">{q.question}</p>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleQuestionEdit(q)}><Edit className="w-3 h-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleQuestionDelete(q.id)}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {opts.map((o: string, i: number) => (
                                <p key={i} className={`text-xs p-1 rounded ${i === q.correct_index ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}>
                                  {String.fromCharCode(65 + i)}. {o}
                                </p>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs capitalize">{q.difficulty}</Badge>
                              <Badge variant="outline" className="text-xs">{q.source}</Badge>
                              {q.year && <Badge variant="outline" className="text-xs">{q.year}</Badge>}
                              {!q.explanation && <Badge variant="destructive" className="text-[10px]">⚠️ No explanation</Badge>}
                            </div>
                          </div>
                        );
                      })}
                      {questions.length === 0 && <p className="text-center text-muted-foreground py-4">No questions yet. Add one above or use bulk import.</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* ─── PDF Import Section ─── */}
      {section === 'pdf-import' && (
        <PdfImportSection adminPassword={adminPassword} examTypes={examTypes} subjects={subjects} selectedExamType={selectedExamType} selectedSubject={selectedSubject} />
      )}

      {/* ─── Exam Analytics Section ─── */}
      {section === 'analytics' && (
        <Card>
          <CardHeader><CardTitle className="text-lg">📊 Exam Analytics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!examAnalytics && !analyticsLoading && (
              <Button onClick={async () => {
                setAnalyticsLoading(true);
                try {
                  const res = await invoke('exam-analytics');
                  setExamAnalytics(res);
                } catch { }
                setAnalyticsLoading(false);
              }}>Load Analytics</Button>
            )}
            {analyticsLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>}
            {examAnalytics && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Questions', value: examAnalytics.total_questions, icon: '❓' },
                    { label: 'Total Attempts', value: examAnalytics.total_attempts, icon: '📝' },
                    { label: 'Avg Accuracy', value: `${examAnalytics.avg_accuracy || 0}%`, icon: '🎯' },
                    { label: 'PDFs Imported', value: examAnalytics.total_pdfs, icon: '📄' },
                  ].map(s => (
                    <Card key={s.label}><CardContent className="pt-4 text-center">
                      <p className="text-2xl">{s.icon}</p>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent></Card>
                  ))}
                </div>
                {examAnalytics.by_exam_type?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">By Exam Type</h4>
                    <div className="space-y-1">
                      {examAnalytics.by_exam_type.map((et: any) => (
                        <div key={et.name} className="flex items-center justify-between p-2 rounded border text-sm">
                          <span>{et.name}</span>
                          <span className="text-muted-foreground">{et.question_count} Qs · {et.attempt_count} attempts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={async () => {
                  setAnalyticsLoading(true);
                  try { const res = await invoke('exam-analytics'); setExamAnalytics(res); } catch { }
                  setAnalyticsLoading(false);
                }}>Refresh</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── PDF Import Section ───
const PdfImportSection = ({ adminPassword, examTypes, subjects, selectedExamType, selectedSubject }: {
  adminPassword: string;
  examTypes: any[];
  subjects: any[];
  selectedExamType: string;
  selectedSubject: string;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ count: number; message: string } | null>(null);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(false);

  const fetchPdfs = async () => {
    if (!selectedExamType) return;
    setLoadingPdfs(true);
    const { data } = await supabase.functions.invoke('admin-resources', {
      body: { password: adminPassword, action: 'list-exam-pdfs', examTypeId: selectedExamType, subjectId: selectedSubject || undefined }
    });
    setPdfs(data?.data || []);
    setLoadingPdfs(false);
  };

  useEffect(() => { fetchPdfs(); }, [selectedExamType, selectedSubject]);

  const handleUpload = async () => {
    if (!file || !selectedExamType || !selectedSubject) {
      toast({ title: "Select exam type, subject and a PDF file", variant: "destructive" });
      return;
    }
    setProcessing(true);
    setResult(null);

    try {
      // 1. Upload PDF to storage
      const filePath = `exam-pdfs/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('exam-pdfs').upload(filePath, file);
      if (uploadError) throw uploadError;

      // 2. Extract text from PDF
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const extractResp = await supabase.functions.invoke('extract-pdf-text', {
        body: { bucket: 'exam-pdfs', path: filePath }
      });

      if (extractResp.error) throw new Error('Failed to extract PDF text');
      const pdfText = extractResp.data?.text || '';

      if (!pdfText.trim()) {
        setResult({ count: 0, message: 'No text could be extracted from this PDF. Try OCR or a different file.' });
        setProcessing(false);
        return;
      }

      // 3. Generate questions from PDF text via exam-practice edge function
      const genResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exam-practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'extract-pdf-questions',
          exam_type_id: selectedExamType,
          subject_id: selectedSubject,
          pdf_text: pdfText,
          filename: file.name,
          file_url: filePath,
        }),
      });

      const genResult = await genResp.json();
      if (genResult.error) throw new Error(genResult.error);

      setResult({ count: genResult.questions_generated || 0, message: `Generated ${genResult.questions_generated} questions from "${file.name}"` });
      setFile(null);
      fetchPdfs();
    } catch (err: any) {
      toast({ title: "PDF import failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      {!selectedExamType || !selectedSubject ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Select an exam type and subject above to import PDFs</CardContent></Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">📄 Import Questions from PDF</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a PDF (past papers, textbooks, question banks). AI will extract and generate structured questions with detailed explanations.
              </p>
              <div><Label>PDF File</Label><Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
              <Button onClick={handleUpload} disabled={processing || !file}>
                {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {processing ? 'Extracting & Generating...' : 'Upload & Generate Questions'}
              </Button>
              {result && (
                <div className={`p-3 rounded-lg border ${result.count > 0 ? 'border-green-500/30 bg-green-500/5' : 'border-muted bg-muted/50'}`}>
                  <p className="text-sm font-medium">{result.message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">PDF Upload History</CardTitle></CardHeader>
            <CardContent>
              {loadingPdfs ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : pdfs.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No PDFs uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {pdfs.map((pdf: any) => (
                    <div key={pdf.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{pdf.filename}</p>
                        <p className="text-xs text-muted-foreground">{pdf.questions_generated} questions · {pdf.status} · {new Date(pdf.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={pdf.status === 'completed' ? 'default' : 'secondary'} className="text-xs capitalize">{pdf.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      </div>
      )}

      {/* Force Update Button */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><RefreshCw className="w-4 h-4" /> App Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Clear all cached data, service workers, and force reload to fix display issues.</p>
          <Button
            variant="destructive"
            onClick={async () => {
              toast({ title: 'Updating...', description: 'Clearing cache and reloading.' });
              try {
                if ('serviceWorker' in navigator) {
                  const registrations = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(registrations.map(r => r.unregister()));
                }
                if ('caches' in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map(k => caches.delete(k)));
                }
                window.location.reload();
              } catch {
                window.location.reload();
              }
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Force Update App
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default AdminResources;
