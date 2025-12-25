import React from 'react';
import { Zap } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg leading-tight">Retell Agent Doc Generator</h1>
            <p className="text-xs text-muted-foreground">Generate beautiful documentation from your AI agent JSON</p>
          </div>
          <div className="sm:hidden">
            <h1 className="font-bold text-base leading-tight">Retell Doc Gen</h1>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded bg-muted">v1.0</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
