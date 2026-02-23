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
import { Lock, Plus, Trash2, Edit, Loader2, Upload, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminResources = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "", description: "", category: "textbook", subject: "",
    grade_level: "", author: "", youtube_url: "", thumbnail_url: "",
    is_free: true, required_tier: "free",
  });
  const [file, setFile] = useState<File | null>(null);

  const verify = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-verify', {
        body: { password },
      });
      if (error) throw error;
      if (data?.valid) {
        setAuthenticated(true);
        setAdminPassword(password);
        fetchResources(password);
      } else {
        toast({ title: "Invalid password", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const fetchResources = async (pwd?: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('store_resources' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setResources(data as any[]);
    setLoading(false);
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    const filePath = `resources/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('store-resources')
      .upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('store-resources').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!form.title || !form.subject || !form.grade_level) {
      toast({ title: "Fill required fields", description: "Title, subject, and grade are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let fileUrl = null;
      if (file) fileUrl = await uploadFile();

      const resource: any = { ...form };
      if (fileUrl) resource.file_url = fileUrl;
      if (!resource.youtube_url) delete resource.youtube_url;
      if (!resource.thumbnail_url) delete resource.thumbnail_url;

      const { data, error } = await supabase.functions.invoke('admin-resources', {
        body: {
          password: adminPassword,
          action: editingId ? 'update' : 'create',
          resource,
          resourceId: editingId,
        },
      });
      if (error) throw error;

      toast({ title: editingId ? "Resource updated" : "Resource added" });
      resetForm();
      fetchResources();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    try {
      await supabase.functions.invoke('admin-resources', {
        body: { password: adminPassword, action: 'delete', resourceId: id },
      });
      toast({ title: "Resource deleted" });
      fetchResources();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = (resource: any) => {
    setEditingId(resource.id);
    setForm({
      title: resource.title, description: resource.description || "",
      category: resource.category, subject: resource.subject,
      grade_level: resource.grade_level, author: resource.author || "",
      youtube_url: resource.youtube_url || "", thumbnail_url: resource.thumbnail_url || "",
      is_free: resource.is_free, required_tier: resource.required_tier,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setFile(null);
    setForm({
      title: "", description: "", category: "textbook", subject: "",
      grade_level: "", author: "", youtube_url: "", thumbnail_url: "",
      is_free: true, required_tier: "free",
    });
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
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
            />
            <Button onClick={verify} disabled={verifying} className="w-full">
              {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Verify
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resource Manager</h1>
        <Button variant="ghost" size="sm" onClick={() => { setAuthenticated(false); setAdminPassword(""); }}>
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </Button>
      </div>

      {/* Add/Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? "Edit Resource" : "Add Resource"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Author</Label>
              <Input value={form.author} onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="textbook">Textbook</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="past_paper">Past Paper</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <Label>Grade Level *</Label>
              <Input value={form.grade_level} onChange={(e) => setForm(f => ({ ...f, grade_level: e.target.value }))} placeholder="e.g. SS1, JSS3" />
            </div>
            <div>
              <Label>Required Tier</Label>
              <Select value={form.required_tier} onValueChange={(v) => setForm(f => ({ ...f, required_tier: v, is_free: v === 'free' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>YouTube URL (for videos)</Label>
              <Input value={form.youtube_url} onChange={(e) => setForm(f => ({ ...f, youtube_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input value={form.thumbnail_url} onChange={(e) => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>

          <div>
            <Label>Upload File (PDF, DOCX, etc.)</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.docx,.doc,.pptx,.xlsx,.txt" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? "Update" : "Add Resource"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Resources ({resources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
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
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(r)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
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

export default AdminResources;
