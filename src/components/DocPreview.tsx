import React, { useState } from 'react';
import { Eye, ChevronDown, ChevronUp, Wrench, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParsedAgent } from '@/lib/agentParser';

interface DocPreviewProps {
  parsed: ParsedAgent | null;
}

const DocPreview: React.FC<DocPreviewProps> = ({ parsed }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showGlobalPrompt, setShowGlobalPrompt] = useState(false);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'conversation': return 'bg-primary/20 text-primary';
      case 'branch': return 'bg-warning/20 text-warning';
      case 'function': return 'bg-purple-500/20 text-purple-400';
      case 'end': return 'bg-destructive/20 text-destructive';
      default: return 'bg-secondary text-secondary-foreground';
    }
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
        <span className="text-xs text-muted-foreground">
          {parsed.nodes.length} nodes
        </span>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-thin p-6 space-y-6">
        {/* Agent Overview */}
        <section className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-2">{parsed.name}</h1>
          {parsed.description && (
            <span className="inline-block px-2 py-1 rounded text-xs bg-primary/10 text-primary mb-4">
              {parsed.description}
            </span>
          )}
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Agent ID:</span>
              <code className="text-xs bg-code px-2 py-1 rounded text-primary break-all">{parsed.id}</code>
            </div>
          </div>
        </section>

        {/* Settings */}
        {Object.keys(parsed.settings).length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '50ms' }}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Configuration
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(parsed.settings).map(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return (
                  <div key={key} className="bg-muted/30 rounded-lg px-3 py-2">
                    <div className="text-xs text-muted-foreground">{formattedKey}</div>
                    <div className="text-sm font-medium truncate">{String(value)}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Global Prompt */}
        {parsed.globalPrompt && (
          <section className="animate-fade-in" style={{ animationDelay: '75ms' }}>
            <button
              onClick={() => setShowGlobalPrompt(!showGlobalPrompt)}
              className="w-full text-left"
            >
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 hover:text-primary transition-colors">
                <FileText className="h-4 w-4 text-warning" />
                Global Prompt
                {showGlobalPrompt ? (
                  <ChevronUp className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                )}
              </h2>
            </button>
            {showGlobalPrompt && (
              <div className="bg-muted/30 rounded-lg p-4 border-l-2 border-warning animate-fade-in">
                <pre className="text-xs whitespace-pre-wrap overflow-x-auto max-h-64 scrollbar-thin text-foreground/80">
                  {parsed.globalPrompt}
                </pre>
              </div>
            )}
          </section>
        )}

        {/* Nodes */}
        <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            Conversation Flow
            <span className="text-xs text-muted-foreground font-normal">
              ({parsed.nodes.length} nodes)
            </span>
          </h2>
          
          <div className="overflow-x-auto">
            <table className="doc-table">
              <thead>
                <tr>
                  <th className="rounded-tl-lg">Node</th>
                  <th>Type</th>
                  <th>Next Nodes</th>
                  <th className="rounded-tr-lg w-10"></th>
                </tr>
              </thead>
              <tbody>
                {parsed.nodes.map((node) => (
                  <React.Fragment key={node.id}>
                    <tr 
                      className="cursor-pointer hover:bg-muted/30" 
                      onClick={() => node.prompt && toggleNode(node.id)}
                    >
                      <td>
                        <div className="font-medium text-sm">{node.name}</div>
                        <code className="text-xs bg-code px-1.5 py-0.5 rounded text-primary/80 mt-1 inline-block">
                          {node.id}
                        </code>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getNodeTypeColor(node.type)}`}>
                          {node.type}
                        </span>
                      </td>
                      <td className="text-sm">
                        {node.next.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {node.next.slice(0, 2).map((n, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                {n.condition.substring(0, 15)}{n.condition.length > 15 ? '...' : ''}
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
                        {node.prompt && (
                          <Button variant="ghost" size="sm" className="btn-icon">
                            {expandedNodes.has(node.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                    {expandedNodes.has(node.id) && node.prompt && (
                      <tr>
                        <td colSpan={4} className="bg-muted/20 p-0">
                          <div className="p-4 animate-fade-in">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                              Prompt / Instruction
                            </h4>
                            <pre className="bg-code rounded-lg p-4 text-sm whitespace-pre-wrap overflow-x-auto text-foreground/90">
                              {node.prompt}
                            </pre>
                            {node.next.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                  Transitions
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {node.next.map((n, i) => (
                                    <span key={i} className="px-2 py-1 rounded text-xs bg-primary/10 text-primary">
                                      {n.condition} → <code className="text-primary/70">{n.targetNodeId}</code>
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

        {/* Tools */}
        {parsed.tools && parsed.tools.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '125ms' }}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-purple-400" />
              Tools
              <span className="text-xs text-muted-foreground font-normal">
                ({parsed.tools.length})
              </span>
            </h2>
            <div className="space-y-2">
              {parsed.tools.map((tool) => (
                <div key={tool.id} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{tool.name}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                      {tool.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                  <code className="text-xs text-muted-foreground/70 mt-1 block">{tool.id}</code>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Post-Call Analysis */}
        {parsed.postCallAnalysis && parsed.postCallAnalysis.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-success" />
              Post-Call Analysis
              <span className="text-xs text-muted-foreground font-normal">
                ({parsed.postCallAnalysis.length} fields)
              </span>
            </h2>
            <div className="overflow-x-auto">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.postCallAnalysis.map((field, i) => (
                    <tr key={i}>
                      <td className="font-medium">{field.name}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-xs bg-success/20 text-success">
                          {field.type}
                        </span>
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {field.description}
                        {field.choices && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {field.choices.map((c, j) => (
                              <span key={j} className="text-xs px-1.5 py-0.5 bg-muted rounded">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Raw JSON */}
        <section className="animate-fade-in" style={{ animationDelay: '175ms' }}>
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
