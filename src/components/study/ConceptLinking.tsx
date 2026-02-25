import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Network, ZoomIn, ZoomOut, Maximize2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { parseConceptMapResponse } from '@/lib/parseAIResponse';

interface MindMapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  depth: number;
  parentId: string | null;
  children: string[];
  expanded: boolean;
  description: string | null;
  loadingDescription: boolean;
  loadingChildren: boolean;
}

interface ConceptLinkingProps {
  onBack: () => void;
}

const DEPTH_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(142 70% 45%)',
  'hsl(280 70% 55%)',
  'hsl(30 90% 55%)',
];

const DEPTH_BG = [
  'bg-primary text-primary-foreground',
  'bg-accent text-accent-foreground',
  'bg-emerald-500 text-white',
  'bg-purple-500 text-white',
  'bg-orange-500 text-white',
];

const ConceptLinking = ({ onBack }: ConceptLinkingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);
  const [nodes, setNodes] = useState<Map<string, MindMapNode>>(new Map());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Canvas state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notes')
      .select('id, title')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotes(data || []);
    setLoading(false);
  };

  const layoutNodes = useCallback((nodeMap: Map<string, MindMapNode>): Map<string, MindMapNode> => {
    const updated = new Map(nodeMap);
    const root = Array.from(updated.values()).find(n => n.depth === 0);
    if (!root) return updated;

    // Place root at center
    root.x = 0;
    root.y = 0;
    updated.set(root.id, root);

    // Layout children by depth rings
    const layoutChildren = (parentId: string, depth: number) => {
      const parent = updated.get(parentId);
      if (!parent) return;
      const childIds = parent.children;
      if (childIds.length === 0) return;

      const radius = 200 + depth * 160;
      // Calculate parent's angle from root for sector allocation
      const parentAngle = depth === 1
        ? null
        : Math.atan2(parent.y, parent.x);

      const angleSpread = depth === 1
        ? (2 * Math.PI)
        : Math.min(Math.PI * 0.6, (childIds.length * 0.4));

      const startAngle = depth === 1
        ? -Math.PI / 2
        : (parentAngle ?? 0) - angleSpread / 2;

      childIds.forEach((cid, i) => {
        const child = updated.get(cid);
        if (!child) return;
        const angleStep = childIds.length === 1 ? 0 : angleSpread / (childIds.length - 1);
        const angle = startAngle + i * angleStep;
        child.x = parent.x + radius * Math.cos(angle);
        child.y = parent.y + radius * Math.sin(angle);
        updated.set(cid, child);
        layoutChildren(cid, depth + 1);
      });
    };

    // Layout depth-1 children around root
    const rootChildren = root.children;
    if (rootChildren.length > 0) {
      const angleStep = (2 * Math.PI) / rootChildren.length;
      rootChildren.forEach((cid, i) => {
        const child = updated.get(cid);
        if (!child) return;
        const angle = -Math.PI / 2 + i * angleStep;
        const radius = 220;
        child.x = radius * Math.cos(angle);
        child.y = radius * Math.sin(angle);
        updated.set(cid, child);
        layoutChildren(cid, 2);
      });
    }

    return updated;
  }, []);

  const generateMindMap = async (noteId: string) => {
    setGenerating(true);
    setNodes(new Map());

    try {
      const { data: note } = await supabase.from('notes').select('content').eq('id', noteId).single();
      if (!note?.content) throw new Error('No content');

      let fullResponse = '';
      await streamAIChat({
        messages: [],
        mode: 'concept_map',
        content: note.content.substring(0, 4000),
        onDelta: (chunk) => { fullResponse += chunk; },
        onDone: () => {
          try {
            const data = parseConceptMapResponse(fullResponse);
            const nodeMap = new Map<string, MindMapNode>();

            data.nodes.forEach((n, i) => {
              nodeMap.set(n.id, {
                id: n.id,
                label: n.label,
                x: 0,
                y: 0,
                depth: i === 0 ? 0 : 1,
                parentId: i === 0 ? null : data.nodes[0].id,
                children: [],
                expanded: false,
                description: null,
                loadingDescription: false,
                loadingChildren: false,
              });
            });

            // Build children arrays from connections
            data.connections.forEach(c => {
              const parent = nodeMap.get(c.from);
              if (parent && nodeMap.has(c.to)) {
                parent.children.push(c.to);
                const child = nodeMap.get(c.to)!;
                child.parentId = c.from;
                // Depth from parent
                const parentNode = nodeMap.get(c.from);
                if (parentNode) child.depth = parentNode.depth + 1;
              }
            });

            // If no connections found, connect all to first
            if (data.connections.length === 0 && data.nodes.length > 1) {
              const root = nodeMap.get(data.nodes[0].id)!;
              data.nodes.slice(1).forEach(n => {
                root.children.push(n.id);
                const child = nodeMap.get(n.id)!;
                child.parentId = root.id;
                child.depth = 1;
              });
            }

            const laid = layoutNodes(nodeMap);
            setNodes(laid);

            // Center view
            setTransform({ x: 0, y: 0, scale: 0.8 });
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

  const handleNodeClick = async (nodeId: string) => {
    const node = nodes.get(nodeId);
    if (!node) return;

    if (node.expanded) {
      // Collapse
      setNodes(prev => {
        const updated = new Map(prev);
        const n = { ...updated.get(nodeId)! };
        n.expanded = false;
        updated.set(nodeId, n);
        return updated;
      });
      return;
    }

    // Expand: show description
    if (!node.description) {
      setNodes(prev => {
        const updated = new Map(prev);
        const n = { ...updated.get(nodeId)! };
        n.loadingDescription = true;
        n.expanded = true;
        updated.set(nodeId, n);
        return updated;
      });

      let desc = '';
      await streamAIChat({
        messages: [],
        mode: 'socratic',
        content: `Explain the concept "${node.label}" in 2-3 short sentences for a student. Be clear and concise.`,
        onDelta: (chunk) => { desc += chunk; },
        onDone: () => {
          setNodes(prev => {
            const updated = new Map(prev);
            const n = { ...updated.get(nodeId)! };
            n.description = desc;
            n.loadingDescription = false;
            updated.set(nodeId, n);
            return updated;
          });
        },
        onError: () => {
          setNodes(prev => {
            const updated = new Map(prev);
            const n = { ...updated.get(nodeId)! };
            n.loadingDescription = false;
            n.description = 'Could not load explanation.';
            updated.set(nodeId, n);
            return updated;
          });
        },
      });
    } else {
      setNodes(prev => {
        const updated = new Map(prev);
        const n = { ...updated.get(nodeId)! };
        n.expanded = true;
        updated.set(nodeId, n);
        return updated;
      });
    }
  };

  const expandNode = async (nodeId: string) => {
    const node = nodes.get(nodeId);
    if (!node || node.loadingChildren) return;

    setNodes(prev => {
      const updated = new Map(prev);
      const n = { ...updated.get(nodeId)! };
      n.loadingChildren = true;
      updated.set(nodeId, n);
      return updated;
    });

    let response = '';
    await streamAIChat({
      messages: [],
      mode: 'concept_map',
      content: `Generate 2-3 sub-concepts for the concept "${node.label}". Return as JSON with nodes and connections arrays. Each node has id and label. Connections have from and to fields. The parent node id is "${node.id}".`,
      onDelta: (chunk) => { response += chunk; },
      onDone: () => {
        try {
          const data = parseConceptMapResponse(response);
          setNodes(prev => {
            const updated = new Map(prev);
            const parent = { ...updated.get(nodeId)! };
            parent.loadingChildren = false;

            const newChildIds: string[] = [];
            data.nodes.forEach(n => {
              if (n.id === nodeId) return; // Skip parent if included
              const newId = `${nodeId}_${n.id}`;
              newChildIds.push(newId);
              updated.set(newId, {
                id: newId,
                label: n.label,
                x: parent.x,
                y: parent.y,
                depth: parent.depth + 1,
                parentId: nodeId,
                children: [],
                expanded: false,
                description: null,
                loadingDescription: false,
                loadingChildren: false,
              });
            });

            parent.children = [...parent.children, ...newChildIds];
            updated.set(nodeId, parent);
            return layoutNodes(updated);
          });
        } catch {
          setNodes(prev => {
            const updated = new Map(prev);
            const n = { ...updated.get(nodeId)! };
            n.loadingChildren = false;
            updated.set(nodeId, n);
            return updated;
          });
          toast({ title: 'Error', description: 'Failed to expand concept', variant: 'destructive' });
        }
      },
      onError: () => {
        setNodes(prev => {
          const updated = new Map(prev);
          const n = { ...updated.get(nodeId)! };
          n.loadingChildren = false;
          updated.set(nodeId, n);
          return updated;
        });
      },
    });
  };

  // Canvas handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(3, prev.scale + delta)),
    }));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [transform.x, transform.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    }));
  }, [isPanning, panStart]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 0.8 });
  };

  const nodesArray = Array.from(nodes.values());

  // Build bezier connections
  const connections: { from: MindMapNode; to: MindMapNode }[] = [];
  nodesArray.forEach(node => {
    node.children.forEach(childId => {
      const child = nodes.get(childId);
      if (child) connections.push({ from: node, to: child });
    });
  });

  const getNodeSize = (depth: number) => {
    if (depth === 0) return { w: 160, h: 50 };
    if (depth === 1) return { w: 130, h: 40 };
    return { w: 110, h: 36 };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 flex items-center gap-3 border-b border-border shrink-0"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Mind Map</h1>
          <p className="text-muted-foreground text-sm">Interactive concept maps</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Network className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {nodes.size === 0 && !generating && (
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <h3 className="text-sm font-medium text-muted-foreground">Select a note to map:</h3>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No notes yet. Create notes first!</p>
          ) : (
            notes.map((note) => (
              <motion.button
                key={note.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => generateMindMap(note.id)}
                className="w-full p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-all"
              >
                <span className="font-medium text-foreground">{note.title}</span>
              </motion.button>
            ))
          )}
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center flex-1">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Generating mind map...</p>
        </div>
      )}

      {nodes.size > 0 && !generating && (
        <>
          {/* Canvas */}
          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-muted/30 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div
              ref={canvasRef}
              className="absolute"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: '0 0',
                left: '50%',
                top: '50%',
              }}
            >
              {/* SVG connections */}
              <svg
                className="absolute overflow-visible"
                style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: 'none' }}
              >
                {connections.map(({ from, to }) => {
                  const fromSize = getNodeSize(from.depth);
                  const toSize = getNodeSize(to.depth);
                  const x1 = from.x + fromSize.w / 2;
                  const y1 = from.y + fromSize.h / 2;
                  const x2 = to.x + toSize.w / 2;
                  const y2 = to.y + toSize.h / 2;
                  const cx = (x1 + x2) / 2;
                  const cy = (y1 + y2) / 2;

                  return (
                    <path
                      key={`${from.id}-${to.id}`}
                      d={`M ${x1} ${y1} Q ${cx} ${y1}, ${cx} ${cy} Q ${cx} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={DEPTH_COLORS[Math.min(to.depth, DEPTH_COLORS.length - 1)]}
                      strokeWidth="2"
                      strokeOpacity="0.4"
                      strokeDasharray={to.depth >= 3 ? '6 4' : 'none'}
                    />
                  );
                })}
              </svg>

              {/* Nodes */}
              {nodesArray.map((node) => {
                const size = getNodeSize(node.depth);
                const colorClass = DEPTH_BG[Math.min(node.depth, DEPTH_BG.length - 1)];
                const fontSize = node.depth === 0 ? 'text-sm font-bold' : node.depth === 1 ? 'text-xs font-semibold' : 'text-[11px] font-medium';

                return (
                  <div
                    key={node.id}
                    data-node
                    className="absolute"
                    style={{
                      left: node.x,
                      top: node.y,
                      width: size.w,
                      zIndex: node.expanded ? 20 : 10,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`rounded-xl px-3 py-2 cursor-pointer shadow-md hover:shadow-lg transition-shadow ${colorClass} ${fontSize} text-center truncate`}
                      style={{ minHeight: size.h }}
                      onClick={() => handleNodeClick(node.id)}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {node.label}
                        {node.expanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                      </span>
                    </motion.div>

                    {/* Expanded detail panel */}
                    <AnimatePresence>
                      {node.expanded && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          className="mt-1 p-3 rounded-xl bg-card border border-border shadow-lg"
                          style={{ width: Math.max(size.w, 200), minWidth: 180 }}
                        >
                          {node.loadingDescription ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Loading...
                            </div>
                          ) : (
                            <p className="text-xs text-foreground leading-relaxed">
                              {node.description}
                            </p>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 h-7 text-xs w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              expandNode(node.id);
                            }}
                            disabled={node.loadingChildren}
                          >
                            {node.loadingChildren ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Plus className="w-3 h-3 mr-1" />
                            )}
                            Expand sub-concepts
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Canvas controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
              <Button
                size="icon"
                variant="secondary"
                className="w-9 h-9 shadow-md"
                onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.2) }))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="w-9 h-9 shadow-md"
                onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.2, prev.scale - 0.2) }))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="w-9 h-9 shadow-md"
                onClick={resetView}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Zoom indicator */}
            <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-card/80 backdrop-blur text-xs text-muted-foreground border border-border z-30">
              {Math.round(transform.scale * 100)}%
            </div>
          </div>

          {/* Bottom bar */}
          <div className="p-3 border-t border-border flex gap-2 shrink-0">
            <Button onClick={() => { setNodes(new Map()); setTransform({ x: 0, y: 0, scale: 1 }); }} variant="outline" className="flex-1">
              New Mind Map
            </Button>
            <div className="text-xs text-muted-foreground flex items-center gap-1 px-2">
              {nodesArray.length} concepts
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConceptLinking;
