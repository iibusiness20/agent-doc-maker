import React, { useState, useCallback } from 'react';
import html2pdf from 'html2pdf.js';
import Header from '@/components/Header';
import JsonInput from '@/components/JsonInput';
import DocPreview from '@/components/DocPreview';
import MarkdownOutput from '@/components/MarkdownOutput';
import MermaidPreview from '@/components/MermaidPreview';
import { parseAgent, generateMarkdown, generateHtml, generateMermaid, ParsedAgent } from '@/lib/agentParser';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [parsed, setParsed] = useState<ParsedAgent | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [mermaidSvg, setMermaidSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = useCallback(() => {
    setError(null);
    
    if (!jsonInput.trim()) {
      setError('Please paste JSON first.');
      return;
    }

    setIsLoading(true);

    try {
      const parsedAgent = parseAgent(jsonInput);
      setParsed(parsedAgent);
      setMarkdown(generateMarkdown(parsedAgent));
      setMermaidCode(generateMermaid(parsedAgent));
      
      toast({
        title: 'Documentation generated!',
        description: `Successfully parsed "${parsedAgent.name}" with ${parsedAgent.nodes.length} nodes.`,
      });
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON, please check your export.');
      } else {
        setError(`Error parsing agent: ${(err as Error).message}`);
      }
      setParsed(null);
      setMarkdown('');
      setMermaidCode('');
    } finally {
      setIsLoading(false);
    }
  }, [jsonInput]);

  const handleMermaidSvgReady = useCallback((svg: string) => {
    setMermaidSvg(svg);
  }, []);

  const handleDownloadHtml = useCallback(() => {
    if (!parsed) return;
    
    const html = generateHtml(parsed, mermaidSvg);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${parsed.name.replace(/\s+/g, '-').toLowerCase()}-documentation.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded!',
      description: 'HTML file saved',
    });
  }, [parsed, mermaidSvg]);

  const handleDownloadPdf = useCallback(async () => {
    if (!parsed) return;
    
    toast({
      title: 'Generating PDF...',
      description: 'Please wait while we create your PDF',
    });

    try {
      const html = generateHtml(parsed, mermaidSvg);
      
      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      
      // Get the body content for PDF generation
      const bodyContent = (container.querySelector('.container') as HTMLElement) || container;
      
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${parsed.name.replace(/\s+/g, '-').toLowerCase()}-documentation.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(bodyContent).save();
      
      // Clean up
      document.body.removeChild(container);
      
      toast({
        title: 'PDF Downloaded!',
        description: 'Your documentation has been saved as PDF',
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast({
        title: 'PDF generation failed',
        description: 'There was an error creating the PDF',
        variant: 'destructive',
      });
    }
  }, [parsed, mermaidSvg]);

  return (
    <div className="min-h-screen bg-background flex flex-col dark">
      <Header />
      
      <main className="flex-1 container mx-auto p-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Left Column - JSON Input */}
        <div className="flex flex-col gap-4 min-h-[400px] lg:min-h-0 lg:h-[calc(100vh-8rem)]">
          <JsonInput
            value={jsonInput}
            onChange={setJsonInput}
            onGenerate={handleGenerate}
            error={error}
            isLoading={isLoading}
          />
        </div>
        
        {/* Middle Column - Preview & Mermaid */}
        <div className="flex flex-col gap-4 min-h-[600px] lg:min-h-0 lg:h-[calc(100vh-8rem)]">
          <div className="flex-1 min-h-0">
            <DocPreview parsed={parsed} />
          </div>
          <div className="h-64 lg:h-72 flex-shrink-0">
            <MermaidPreview 
              code={mermaidCode} 
              onSvgReady={handleMermaidSvgReady}
            />
          </div>
        </div>
        
        {/* Right Column - Markdown Output */}
        <div className="flex flex-col gap-4 min-h-[300px] lg:min-h-0 lg:h-[calc(100vh-8rem)] lg:col-span-2 xl:col-span-1">
          <MarkdownOutput
            markdown={markdown}
            agentName={parsed?.name || 'agent'}
            onDownloadHtml={handleDownloadHtml}
            onDownloadPdf={handleDownloadPdf}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
