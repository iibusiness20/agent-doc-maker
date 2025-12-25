// Types for the parsed agent data
// Adjust these interfaces when plugging in real Retell exports

export interface AgentCondition {
  condition: string;
  targetNodeId: string;
}

export interface AgentNode {
  id: string;
  name: string;
  type: string;
  prompt: string;
  conditions: string[];
  next: AgentCondition[];
}

export interface AgentSettings {
  model?: string;
  temperature?: number;
  language?: string;
  voice?: string;
  maxDuration?: number;
  [key: string]: unknown; // Allow additional settings
}

export interface ParsedAgent {
  id: string;
  name: string;
  description: string;
  settings: AgentSettings;
  nodes: AgentNode[];
  rawJson: unknown;
}

/**
 * Parses the raw JSON export from Retell AI into a structured ParsedAgent object.
 * 
 * CUSTOMIZATION NOTES:
 * - Adjust field mappings below based on actual Retell export schema
 * - The current mapping assumes a structure with agent.id, agent.name, agent.nodes, etc.
 * - Add new fields to the interfaces above as needed
 */
export function parseAgent(rawJson: string): ParsedAgent {
  const json = JSON.parse(rawJson);
  
  // Extract agent-level fields
  // CUSTOMIZE: Adjust these field names based on actual Retell schema
  const id = json.id || json.agent_id || json.agentId || 'unknown';
  const name = json.name || json.agent_name || json.agentName || 'Unnamed Agent';
  const description = json.description || json.desc || json.purpose || '';
  
  // Extract settings
  // CUSTOMIZE: Map additional settings fields as needed
  const rawSettings = json.settings || json.config || json.configuration || {};
  const settings: AgentSettings = {
    model: rawSettings.model || rawSettings.llm_model || undefined,
    temperature: rawSettings.temperature ?? undefined,
    language: rawSettings.language || rawSettings.lang || undefined,
    voice: rawSettings.voice || rawSettings.voice_id || undefined,
    maxDuration: rawSettings.max_duration || rawSettings.maxDuration || undefined,
  };
  
  // Clean up undefined values
  Object.keys(settings).forEach(key => {
    if (settings[key] === undefined) {
      delete settings[key];
    }
  });
  
  // Extract nodes
  // CUSTOMIZE: Adjust node field mappings based on actual Retell schema
  const rawNodes = json.nodes || json.flow?.nodes || json.steps || [];
  const nodes: AgentNode[] = rawNodes.map((node: any) => ({
    id: node.id || node.node_id || node.nodeId || `node_${Math.random().toString(36).substr(2, 9)}`,
    name: node.name || node.label || node.title || 'Unnamed Node',
    type: node.type || node.node_type || node.nodeType || 'unknown',
    prompt: node.prompt || node.instructions || node.content || node.text || '',
    conditions: Array.isArray(node.conditions) ? node.conditions : [],
    next: Array.isArray(node.next) 
      ? node.next.map((n: any) => ({
          condition: n.condition || n.label || n.trigger || 'default',
          targetNodeId: n.targetNodeId || n.target || n.next_node || n.nextNode || '',
        }))
      : [],
  }));
  
  return {
    id,
    name,
    description,
    settings,
    nodes,
    rawJson: json,
  };
}

/**
 * Generates a Mermaid flowchart diagram from the parsed agent.
 */
export function generateMermaid(parsed: ParsedAgent): string {
  const lines: string[] = ['graph TD'];
  
  if (parsed.nodes.length === 0) {
    lines.push('  NoNodes[No nodes found]');
    return lines.join('\n');
  }
  
  // Add node definitions with sanitized names
  parsed.nodes.forEach((node) => {
    const sanitizedName = node.name.replace(/[^\w\s]/g, '').substring(0, 30);
    const nodeShape = node.type === 'start' ? `((${sanitizedName}))` 
      : node.type === 'end' ? `([${sanitizedName}])` 
      : `[${sanitizedName}]`;
    lines.push(`  ${node.id}${nodeShape}`);
  });
  
  // Add connections
  parsed.nodes.forEach((node) => {
    node.next.forEach((connection) => {
      const conditionLabel = connection.condition !== 'default' 
        ? `|${connection.condition.replace(/[^\w\s]/g, '').substring(0, 20)}|` 
        : '';
      lines.push(`  ${node.id} -->${conditionLabel} ${connection.targetNodeId}`);
    });
  });
  
  return lines.join('\n');
}

/**
 * Generates Markdown documentation from the parsed agent.
 */
export function generateMarkdown(parsed: ParsedAgent): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`# ${parsed.name}`);
  lines.push('');
  
  // Overview
  lines.push('## Agent Overview');
  lines.push('');
  lines.push(`| Property | Value |`);
  lines.push(`|----------|-------|`);
  lines.push(`| **Agent ID** | \`${parsed.id}\` |`);
  lines.push(`| **Name** | ${parsed.name} |`);
  if (parsed.description) {
    lines.push(`| **Description** | ${parsed.description} |`);
  }
  
  // Settings
  if (Object.keys(parsed.settings).length > 0) {
    lines.push('');
    lines.push('### Settings');
    lines.push('');
    lines.push(`| Setting | Value |`);
    lines.push(`|---------|-------|`);
    Object.entries(parsed.settings).forEach(([key, value]) => {
      lines.push(`| **${key}** | ${value} |`);
    });
  }
  
  lines.push('');
  
  // Nodes
  lines.push('## Nodes and Prompts');
  lines.push('');
  
  if (parsed.nodes.length === 0) {
    lines.push('*No nodes found in this agent.*');
  } else {
    lines.push('| Node ID | Name | Type | Prompt | Conditions | Next Nodes |');
    lines.push('|---------|------|------|--------|------------|------------|');
    
    parsed.nodes.forEach((node) => {
      const promptPreview = node.prompt.length > 100 
        ? node.prompt.substring(0, 100).replace(/\n/g, ' ') + '...' 
        : node.prompt.replace(/\n/g, ' ');
      const conditions = node.conditions.length > 0 ? node.conditions.join(', ') : '-';
      const nextNodes = node.next.length > 0 
        ? node.next.map(n => `${n.condition} → ${n.targetNodeId}`).join('; ') 
        : '-';
      
      lines.push(`| \`${node.id}\` | ${node.name} | ${node.type} | ${promptPreview} | ${conditions} | ${nextNodes} |`);
    });
  }
  
  lines.push('');
  
  // Flow diagram
  lines.push('## Flow Diagram');
  lines.push('');
  lines.push('```mermaid');
  lines.push(generateMermaid(parsed));
  lines.push('```');
  lines.push('');
  
  // Detailed prompts
  if (parsed.nodes.some(n => n.prompt)) {
    lines.push('## Detailed Prompts');
    lines.push('');
    
    parsed.nodes.forEach((node) => {
      if (node.prompt) {
        lines.push(`### ${node.name} (\`${node.id}\`)`);
        lines.push('');
        lines.push('```');
        lines.push(node.prompt);
        lines.push('```');
        lines.push('');
      }
    });
  }
  
  // Raw JSON
  lines.push('## Raw JSON');
  lines.push('');
  lines.push('<details>');
  lines.push('<summary>Click to expand raw JSON</summary>');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(parsed.rawJson, null, 2));
  lines.push('```');
  lines.push('');
  lines.push('</details>');
  
  return lines.join('\n');
}

/**
 * Generates HTML documentation from the parsed agent.
 * This is used for the preview and HTML export.
 */
export function generateHtml(parsed: ParsedAgent, mermaidSvg?: string): string {
  const settingsRows = Object.entries(parsed.settings)
    .map(([key, value]) => `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>`)
    .join('');
  
  const nodesRows = parsed.nodes.map((node) => {
    const promptPreview = node.prompt.length > 200 
      ? node.prompt.substring(0, 200) + '...' 
      : node.prompt;
    const conditions = node.conditions.length > 0 ? node.conditions.join(', ') : '—';
    const nextNodes = node.next.length > 0 
      ? node.next.map(n => `<span class="next-node">${n.condition} → ${n.targetNodeId}</span>`).join('<br>') 
      : '—';
    
    return `
      <tr>
        <td><code>${node.id}</code></td>
        <td>${node.name}</td>
        <td><span class="node-type">${node.type}</span></td>
        <td class="prompt-cell">${promptPreview.replace(/\n/g, '<br>')}</td>
        <td>${conditions}</td>
        <td>${nextNodes}</td>
      </tr>
    `;
  }).join('');
  
  const detailedPrompts = parsed.nodes
    .filter(n => n.prompt)
    .map((node) => `
      <div class="prompt-detail">
        <h4>${node.name} <code>${node.id}</code></h4>
        <pre>${node.prompt}</pre>
      </div>
    `).join('');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${parsed.name} - Documentation</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f1419;
      color: #e7e9ea;
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #1db9a0; }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; color: #e7e9ea; border-bottom: 1px solid #2f3336; padding-bottom: 0.5rem; }
    h3 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; color: #8899a6; }
    h4 { font-size: 1rem; margin-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #2f3336; }
    th { background: #1a1f26; color: #8899a6; font-weight: 600; }
    tr:hover td { background: rgba(29, 185, 160, 0.05); }
    code { background: #1a1f26; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; color: #1db9a0; }
    pre { background: #1a1f26; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.875rem; white-space: pre-wrap; }
    .node-type { background: #2f3336; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
    .next-node { background: rgba(29, 185, 160, 0.15); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.8rem; display: inline-block; margin: 0.1rem 0; }
    .prompt-cell { max-width: 300px; font-size: 0.875rem; color: #8899a6; }
    .prompt-detail { margin: 1rem 0; padding: 1rem; background: #1a1f26; border-radius: 8px; }
    .prompt-detail h4 { color: #e7e9ea; }
    .prompt-detail code { margin-left: 0.5rem; }
    .prompt-detail pre { margin-top: 0.75rem; background: #0f1419; }
    .mermaid-container { background: #1a1f26; padding: 2rem; border-radius: 8px; margin: 1rem 0; }
    .mermaid { background: transparent; }
    details { margin: 1rem 0; }
    summary { cursor: pointer; color: #1db9a0; font-weight: 500; }
    details pre { margin-top: 1rem; }
    @media (max-width: 768px) {
      body { padding: 1rem; }
      table { display: block; overflow-x: auto; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${parsed.name}</h1>
    
    <h2>Agent Overview</h2>
    <table>
      <tr><td><strong>Agent ID</strong></td><td><code>${parsed.id}</code></td></tr>
      <tr><td><strong>Name</strong></td><td>${parsed.name}</td></tr>
      ${parsed.description ? `<tr><td><strong>Description</strong></td><td>${parsed.description}</td></tr>` : ''}
    </table>
    
    ${Object.keys(parsed.settings).length > 0 ? `
      <h3>Settings</h3>
      <table>
        ${settingsRows}
      </table>
    ` : ''}
    
    <h2>Nodes and Prompts</h2>
    ${parsed.nodes.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Node ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Prompt</th>
            <th>Conditions</th>
            <th>Next Nodes</th>
          </tr>
        </thead>
        <tbody>
          ${nodesRows}
        </tbody>
      </table>
    ` : '<p>No nodes found in this agent.</p>'}
    
    <h2>Flow Diagram</h2>
    <div class="mermaid-container">
      ${mermaidSvg ? mermaidSvg : `<pre class="mermaid">${generateMermaid(parsed)}</pre>`}
    </div>
    
    ${detailedPrompts ? `
      <h2>Detailed Prompts</h2>
      ${detailedPrompts}
    ` : ''}
    
    <h2>Raw JSON</h2>
    <details>
      <summary>Click to expand raw JSON</summary>
      <pre>${JSON.stringify(parsed.rawJson, null, 2)}</pre>
    </details>
  </div>
  
  <script>
    mermaid.initialize({ 
      startOnLoad: true, 
      theme: 'dark',
      themeVariables: {
        primaryColor: '#1db9a0',
        primaryTextColor: '#e7e9ea',
        primaryBorderColor: '#2f3336',
        lineColor: '#8899a6',
        secondaryColor: '#1a1f26',
        tertiaryColor: '#0f1419'
      }
    });
  </script>
</body>
</html>
  `.trim();
}
