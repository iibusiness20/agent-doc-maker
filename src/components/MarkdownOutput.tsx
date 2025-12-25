import React from 'react';
import { FileCode, Copy, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface MarkdownOutputProps {
  markdown: string;
  agentName: string;
  onDownloadHtml: () => void;
  onDownloadPdf: () => void;
}

const MarkdownOutput: React.FC<MarkdownOutputProps> = ({
  markdown,
  agentName,
  onDownloadHtml,
  onDownloadPdf,
}) => {
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast({
        title: 'Copied!',
        description: 'Markdown copied to clipboard',
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentName.replace(/\s+/g, '-').toLowerCase()}-documentation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded!',
      description: 'Markdown file saved',
    });
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Markdown Output</h2>
        </div>
        
        {markdown && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyMarkdown}
              className="text-xs gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex-1 p-4 flex flex-col gap-4 min-h-0">
        <textarea
          value={markdown}
          readOnly
          className="flex-1 w-full bg-muted/50 border border-border rounded-lg p-4 font-mono text-xs resize-none focus:outline-none scrollbar-thin placeholder:text-muted-foreground/50"
          placeholder="Generated Markdown will appear here..."
          spellCheck={false}
        />
        
        {markdown && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadMarkdown}
              className="flex-1 min-w-fit gap-2"
            >
              <Download className="h-4 w-4" />
              Download .md
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onDownloadHtml}
              className="flex-1 min-w-fit gap-2"
            >
              <FileText className="h-4 w-4" />
              Download .html
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onDownloadPdf}
              className="flex-1 min-w-fit gap-2"
            >
              <FileText className="h-4 w-4" />
              Download .pdf
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownOutput;
