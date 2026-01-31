import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { parseConceptMapResponse } from '@/lib/parseAIResponse';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  connections: string[];
}

interface ConceptLinkingProps {
  onBack: () => void;
}

const ConceptLinking = ({ onBack }: ConceptLinkingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    const { data } = await supabase.from('notes').select('id, title').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(20);
    setNotes(data || []);
    setLoading(false);
  };

  const generateMindMap = async (noteId: string) => {
    setGenerating(true);
    setNodes([]);

    try {
      const { data: note } = await supabase.from('notes').select('content').eq('id', noteId).single();
      if (!note?.content) throw new Error('No content');

      let fullResponse = '';
      await streamAIChat({
        messages: [],
        mode: 'concept_map',
        content: note.content.substring(0, 3000),
        onDelta: (chunk) => { fullResponse += chunk; },
        onDone: () => {
          try {
            const data = parseConceptMapResponse(fullResponse);
            const centerX = 150;
            const centerY = 150;
            const radius = 120;
            
            const mappedNodes: Node[] = data.nodes.map((n, i) => {
              const angle = (i * 2 * Math.PI) / data.nodes.length;
              const isCenter = i === 0;
              return {
                id: n.id,
                label: n.label,
                x: isCenter ? centerX : centerX + radius * Math.cos(angle),
                y: isCenter ? centerY : centerY + radius * Math.sin(angle),
                connections: data.connections
                  .filter((c) => c.from === n.id)
                  .map((c) => c.to),
              };
            });
            setNodes(mappedNodes);
          } catch (e) {
            console.error('Failed to parse concept map:', e, fullResponse);
            toast({ title: 'Error', description: 'Failed to parse mind map. Please try again.', variant: 'destructive' });
          }
          setGenerating(false);
        },
        onError: (err) => {
          toast({ title: 'Error', description: err, variant: 'destructive' });
          setGenerating(false);
        },
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate mind map', variant: 'destructive' });
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Concept Linking</h1>
          <p className="text-muted-foreground text-sm">Visual mind maps connecting topics</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Network className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {nodes.length === 0 && !generating && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Select a note to map:</h3>
          {notes.map((note) => (
            <motion.button
              key={note.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => generateMindMap(note.id)}
              className="w-full p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-all"
            >
              <span className="font-medium text-foreground">{note.title}</span>
            </motion.button>
          ))}
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Generating concept map...</p>
        </div>
      )}

      {nodes.length > 0 && !generating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative bg-card border border-border rounded-2xl overflow-hidden"
          style={{ height: '400px' }}
        >
          <svg className="w-full h-full">
            {/* Draw connections */}
            {nodes.map((node) =>
              node.connections.map((targetId) => {
                const target = nodes.find((n) => n.id === targetId);
                if (!target) return null;
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={node.x + 50}
                    y1={node.y + 20}
                    x2={target.x + 50}
                    y2={target.y + 20}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeOpacity="0.3"
                  />
                );
              })
            )}
          </svg>

          {/* Draw nodes */}
          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`absolute px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                i === 0
                  ? 'gradient-primary text-primary-foreground'
                  : selectedNode === node.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-primary/20'
              }`}
              style={{ left: node.x, top: node.y, maxWidth: '100px' }}
              onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
            >
              {node.label}
            </motion.div>
          ))}
        </motion.div>
      )}

      {nodes.length > 0 && (
        <Button onClick={() => setNodes([])} variant="outline" className="w-full">
          Generate from another note
        </Button>
      )}
    </div>
  );
};

export default ConceptLinking;
