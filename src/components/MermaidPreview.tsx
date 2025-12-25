import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { GitBranch, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MermaidPreviewProps {
  code: string;
  onSvgReady?: (svg: string) => void;
}

const MermaidPreview: React.FC<MermaidPreviewProps> = ({ code, onSvgReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#1db9a0',
        primaryTextColor: '#e7e9ea',
        primaryBorderColor: '#2f3336',
        lineColor: '#8899a6',
        secondaryColor: '#1a1f26',
        tertiaryColor: '#0f1419',
        background: '#1a1f26',
        mainBkg: '#1a1f26',
        nodeBorder: '#1db9a0',
      },
      flowchart: {
        curve: 'basis',
        padding: 20,
      },
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !code) return;

      try {
        setError(null);
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        containerRef.current.innerHTML = svg;
        
        // Make SVG responsive
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
        }

        if (onSvgReady) {
          onSvgReady(svg);
        }
      } catch (err) {
        setError('Failed to render diagram');
        console.error('Mermaid render error:', err);
      }
    };

    renderDiagram();
  }, [code, onSvgReady]);

  return (
    <>
      <div className="panel h-full flex flex-col">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Flow Diagram</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(true)}
            className="btn-icon hover:bg-muted"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 p-4 overflow-auto scrollbar-thin">
          {error ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {error}
            </div>
          ) : code ? (
            <div
              ref={containerRef}
              className="flex items-center justify-center min-h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Generate documentation to see the flow diagram
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Flow Diagram</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="btn-icon hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 p-8 overflow-auto scrollbar-thin flex items-center justify-center">
            <div
              dangerouslySetInnerHTML={{ __html: containerRef.current?.innerHTML || '' }}
              className="max-w-full"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MermaidPreview;
