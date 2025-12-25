import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDemoJsonString } from '@/lib/demoData';

interface JsonInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  error: string | null;
  isLoading: boolean;
}

const JsonInput: React.FC<JsonInputProps> = ({
  value,
  onChange,
  onGenerate,
  error,
  isLoading,
}) => {
  const handleLoadDemo = () => {
    onChange(getDemoJsonString());
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">JSON Input</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLoadDemo}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          Load Demo
        </Button>
      </div>
      
      <div className="flex-1 p-4 flex flex-col gap-4">
        <label className="text-sm text-muted-foreground">
          Paste your Retell agent JSON export here
        </label>
        
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 w-full bg-muted/50 border border-border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all scrollbar-thin placeholder:text-muted-foreground/50"
          placeholder={`{
  "id": "agent_123",
  "name": "Example Agent",
  "description": "Short description",
  "settings": { },
  "nodes": [
    {
      "id": "node_1",
      "type": "prompt",
      "name": "Intro",
      "prompt": "Full prompt text here...",
      "conditions": [],
      "next": [
        { "condition": "booking", "targetNodeId": "node_2" }
      ]
    }
  ]
}`}
          spellCheck={false}
        />
        
        {error && (
          <div className="px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm animate-fade-in">
            {error}
          </div>
        )}
        
        <Button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            'Generate Documentation'
          )}
        </Button>
      </div>
    </div>
  );
};

export default JsonInput;
