import { useState } from "react";
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
import { Lock, Plus, Trash2, Edit, Loader2, LogOut, Megaphone, Trophy, Users, BarChart3, CreditCard, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminResources = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const verify = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-verify', { body: { password } });
      if (error) throw error;
      if (data?.valid) {
        setAuthenticated(true);
        setAdminPassword(password);
      } else {
        toast({ title: "Invalid password", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
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
    <div className="min-h-screen bg-background p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={() => { setAuthenticated(false); setAdminPassword(""); }}>
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </Button>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="analytics" className="text-xs"><BarChart3 className="w-3 h-3 mr-1" />Analytics</TabsTrigger>
          <TabsTrigger value="resources" className="text-xs"><Plus className="w-3 h-3 mr-1" />Resources</TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs"><Megaphone className="w-3 h-3 mr-1" />Announce</TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs"><Trophy className="w-3 h-3 mr-1" />Achieve</TabsTrigger>
          <TabsTrigger value="users" className="text-xs"><Users className="w-3 h-3 mr-1" />Users</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs"><CreditCard className="w-3 h-3 mr-1" />Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics"><AnalyticsTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="resources"><ResourcesTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="announcements"><AnnouncementsTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="achievements"><AchievementsTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="users"><UsersTab adminPassword={adminPassword} /></TabsContent>
        <TabsContent value="payments"><PaymentsTab adminPassword={adminPassword} /></TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Analytics Tab ───
const AnalyticsTab = ({ adminPassword }: { adminPassword: string }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'analytics' } });
    if (!error && data) setStats(data);
    setLoading(false);
  };

  if (!stats && !loading) fetch();

  const items = stats ? [
    { label: "Total Users", value: stats.total_users, icon: "👥" },
    { label: "Active Today", value: stats.active_today, icon: "🟢" },
    { label: "Total Resources", value: stats.total_resources, icon: "📚" },
    { label: "Quiz Attempts", value: stats.total_quizzes, icon: "📝" },
    { label: "Plus Subscribers", value: stats.plus_subscribers, icon: "⭐" },
    { label: "Pro Subscribers", value: stats.pro_subscribers, icon: "💎" },
  ] : [];

  return (
    <div className="space-y-4">
      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map(i => (
              <Card key={i.label}>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl mb-1">{i.icon}</p>
                  <p className="text-2xl font-bold">{i.value}</p>
                  <p className="text-sm text-muted-foreground">{i.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetch}><Loader2 className="w-3 h-3 mr-1" />Refresh</Button>
        </>
      )}
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

  if (loading && resources.length === 0) fetchResources();

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

  if (loading && items.length === 0) fetchAll();

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

  if (loading && items.length === 0) fetchAll();

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
            <div><Label>Requirement Type</Label><Input value={form.requirement_type} onChange={(e) => setForm(f => ({ ...f, requirement_type: e.target.value }))} /></div>
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

  const fetchUsers = async (q?: string) => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('admin-resources', { body: { password: adminPassword, action: 'list-users', search: q || "" } });
    if (data?.data) setUsers(data.data);
    setLoading(false);
  };

  if (!loading && users.length === 0) fetchUsers();

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
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Tier</TableHead><TableHead>XP</TableHead><TableHead>Streak</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || u.display_name || "—"}</TableCell>
                      <TableCell className="text-sm">{u.username || "—"}</TableCell>
                      <TableCell><Badge className="capitalize text-xs">{u.subscription_tier || "free"}</Badge></TableCell>
                      <TableCell>{u.total_xp || 0}</TableCell>
                      <TableCell>{u.current_streak || 0}🔥</TableCell>
                      <TableCell className="text-sm">{u.grade_level || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {users.length === 0 && <p className="text-center text-muted-foreground py-4">No users found</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Payments Tab ───
const PaymentsTab = ({ adminPassword }: { adminPassword: string }) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

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
      const expiresAt = tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.functions.invoke('admin-resources', {
        body: { password: adminPassword, action: 'update-subscription', userId, subscription_tier: tier, subscription_expires_at: expiresAt },
      });
      toast({ title: `Updated to ${tier}` });
      fetchUsers();
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">Payment Resolution</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Search for a user, then manually upgrade or downgrade their subscription.</p>
          <div className="flex gap-2">
            <Input placeholder="Search by username or name..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()} />
            <Button onClick={fetchUsers}><Search className="w-4 h-4" /></Button>
          </div>
          {loading ? <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{u.full_name || u.display_name || u.username || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">Current: <Badge className="capitalize text-xs">{u.subscription_tier || "free"}</Badge>
                      {u.subscription_expires_at && <span className="ml-2">Expires: {new Date(u.subscription_expires_at).toLocaleDateString()}</span>}
                    </p>
                  </div>
                  <div className="flex gap-1">
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

export default AdminResources;
