import React, { useState } from 'react';
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParsedAgent } from '@/lib/agentParser';

interface DocPreviewProps {
  parsed: ParsedAgent | null;
}

const DocPreview: React.FC<DocPreviewProps> = ({ parsed }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  if (!parsed) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Documentation Preview</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Generate documentation to see the preview
        </div>
      </div>
    );
  }

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Documentation Preview</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-thin p-6 space-y-6">
        {/* Agent Overview */}
        <section className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-4">{parsed.name}</h1>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Agent ID:</span>
              <code className="text-xs bg-code px-2 py-1 rounded text-primary">{parsed.id}</code>
            </div>
            {parsed.description && (
              <p className="text-sm text-muted-foreground">{parsed.description}</p>
            )}
          </div>
        </section>

        {/* Settings */}
        {Object.keys(parsed.settings).length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '50ms' }}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Settings
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(parsed.settings).map(([key, value]) => (
                <div key={key} className="bg-muted/30 rounded-lg px-3 py-2">
                  <div className="text-xs text-muted-foreground capitalize">{key}</div>
                  <div className="text-sm font-medium">{String(value)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nodes */}
        <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            Nodes & Prompts
            <span className="text-xs text-muted-foreground font-normal">
              ({parsed.nodes.length} nodes)
            </span>
          </h2>
          
          <div className="overflow-x-auto">
            <table className="doc-table">
              <thead>
                <tr>
                  <th className="rounded-tl-lg">Node ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Next Nodes</th>
                  <th className="rounded-tr-lg w-10"></th>
                </tr>
              </thead>
              <tbody>
                {parsed.nodes.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <tr className="cursor-pointer hover:bg-muted/30" onClick={() => toggleNode(node.id)}>
                      <td>
                        <code className="text-xs bg-code px-2 py-1 rounded text-primary">{node.id}</code>
                      </td>
                      <td className="font-medium">{node.name}</td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                          {node.type}
                        </span>
                      </td>
                      <td className="text-sm">
                        {node.next.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {node.next.slice(0, 2).map((n, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                {n.condition} → {n.targetNodeId}
                              </span>
                            ))}
                            {node.next.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{node.next.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td>
                        <Button variant="ghost" size="sm" className="btn-icon">
                          {expandedNodes.has(node.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                    {expandedNodes.has(node.id) && node.prompt && (
                      <tr>
                        <td colSpan={5} className="bg-muted/20 p-0">
                          <div className="p-4 animate-fade-in">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                              Prompt
                            </h4>
                            <pre className="bg-code rounded-lg p-4 text-sm whitespace-pre-wrap overflow-x-auto text-foreground/90">
                              {node.prompt}
                            </pre>
                            {node.conditions.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                  Conditions
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {node.conditions.map((cond, i) => (
                                    <span key={i} className="px-2 py-1 rounded text-xs bg-warning/10 text-warning">
                                      {cond}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Raw JSON */}
        <section className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Show Raw JSON
            </summary>
            <pre className="mt-3 bg-code rounded-lg p-4 text-xs overflow-x-auto max-h-64 scrollbar-thin">
              {JSON.stringify(parsed.rawJson, null, 2)}
            </pre>
          </details>
        </section>
      </div>
    </div>
  );
};

export default DocPreview;
