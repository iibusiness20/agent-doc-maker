// Types for the parsed agent data
// Updated to handle real Retell AI exports

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
  voiceSpeed?: number;
  voiceTemperature?: number;
  responsiveness?: number;
  interruptionSensitivity?: number;
  ambientSound?: string;
  maxCallDuration?: string;
  reminderTrigger?: string;
  endCallAfterSilence?: string;
  sttMode?: string;
  [key: string]: unknown;
}

export interface AgentTool {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface PostCallAnalysis {
  name: string;
  description: string;
  type: string;
  choices?: string[];
  examples?: string[];
}

export interface ParsedAgent {
  id: string;
  name: string;
  description: string;
  settings: AgentSettings;
  nodes: AgentNode[];
  tools: AgentTool[];
  postCallAnalysis: PostCallAnalysis[];
  globalPrompt: string;
  rawJson: unknown;
}

/**
 * Formats milliseconds to human readable duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60000).toFixed(1)} min`;
}

/**
 * Parses the raw JSON export from Retell AI into a structured ParsedAgent object.
 * 
 * CUSTOMIZATION NOTES:
 * - This parser now handles real Retell AI conversation flow exports
 * - The structure includes conversationFlow.nodes with instruction.text for prompts
 * - Edges use destination_node_id and transition_condition.prompt
 */
export function parseAgent(rawJson: string): ParsedAgent {
  const json = JSON.parse(rawJson);
  
  // Extract agent-level fields (Retell uses agent_id, agent_name)
  const id = json.agent_id || json.id || json.agentId || 'unknown';
  const name = json.agent_name || json.name || json.agentName || 'Unnamed Agent';
  const description = json.description || json.version_title || json.desc || '';
  
  // Extract global prompt from conversationFlow
  const globalPrompt = json.conversationFlow?.global_prompt || json.global_prompt || '';
  
  // Extract settings from various locations in Retell schema
  const settings: AgentSettings = {};
  
  // Model settings from conversationFlow
  if (json.conversationFlow?.model_choice?.model) {
    settings.model = json.conversationFlow.model_choice.model;
  }
  if (json.conversationFlow?.model_temperature !== undefined) {
    settings.temperature = json.conversationFlow.model_temperature;
  }
  
  // Voice and language settings
  if (json.language) settings.language = json.language;
  if (json.voice_id) settings.voice = json.voice_id;
  if (json.voice_speed) settings.voiceSpeed = json.voice_speed;
  if (json.voice_temperature) settings.voiceTemperature = json.voice_temperature;
  
  // Interaction settings
  if (json.responsiveness) settings.responsiveness = json.responsiveness;
  if (json.interruption_sensitivity) settings.interruptionSensitivity = json.interruption_sensitivity;
  if (json.ambient_sound) settings.ambientSound = json.ambient_sound;
  if (json.stt_mode) settings.sttMode = json.stt_mode;
  
  // Duration settings
  if (json.max_call_duration_ms) settings.maxCallDuration = formatDuration(json.max_call_duration_ms);
  if (json.reminder_trigger_ms) settings.reminderTrigger = formatDuration(json.reminder_trigger_ms);
  if (json.end_call_after_silence_ms) settings.endCallAfterSilence = formatDuration(json.end_call_after_silence_ms);
  
  // Legacy settings object
  if (json.settings) {
    Object.entries(json.settings).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        settings[key] = value;
      }
    });
  }
  
  // Extract nodes from conversationFlow (Retell structure)
  const rawNodes = json.conversationFlow?.nodes || json.nodes || json.flow?.nodes || json.steps || [];
  
  const nodes: AgentNode[] = rawNodes.map((node: any) => {
    // Get prompt from instruction.text (Retell) or prompt field
    const prompt = node.instruction?.text || node.prompt || node.instructions || node.content || '';
    
    // Get conditions from edges' transition_condition.prompt
    const conditions: string[] = [];
    if (node.else_edge?.transition_condition?.prompt) {
      conditions.push(`Else: ${node.else_edge.transition_condition.prompt}`);
    }
    
    // Get next nodes from edges array (Retell structure)
    const next: AgentCondition[] = [];
    
    if (Array.isArray(node.edges)) {
      node.edges.forEach((edge: any) => {
        const condition = edge.transition_condition?.prompt || edge.condition || edge.label || 'default';
        const targetNodeId = edge.destination_node_id || edge.targetNodeId || edge.target || edge.next_node || '';
        if (targetNodeId) {
          next.push({ condition, targetNodeId });
        }
      });
    }
    
    // Handle else_edge (Retell branch nodes)
    if (node.else_edge?.destination_node_id) {
      next.push({
        condition: 'Else',
        targetNodeId: node.else_edge.destination_node_id,
      });
    }
    
    // Handle skip_response_edge (Retell special edges)
    if (node.skip_response_edge?.destination_node_id) {
      next.push({
        condition: 'Skip Response',
        targetNodeId: node.skip_response_edge.destination_node_id,
      });
    }
    
    // Legacy next array format
    if (Array.isArray(node.next)) {
      node.next.forEach((n: any) => {
        next.push({
          condition: n.condition || n.label || n.trigger || 'default',
          targetNodeId: n.targetNodeId || n.target || n.next_node || n.nextNode || '',
        });
      });
    }
    
    return {
      id: node.id || node.node_id || node.nodeId || `node_${Math.random().toString(36).substr(2, 9)}`,
      name: node.name || node.label || node.title || 'Unnamed Node',
      type: node.type || node.node_type || node.nodeType || 'unknown',
      prompt,
      conditions,
      next,
    };
  });
  
  // Extract tools from conversationFlow
  const rawTools = json.conversationFlow?.tools || json.tools || [];
  const tools: AgentTool[] = rawTools.map((tool: any) => ({
    id: tool.tool_id || tool.id || '',
    name: tool.name || 'Unnamed Tool',
    type: tool.type || 'unknown',
    description: tool.description || '',
  }));
  
  // Extract post-call analysis data
  const postCallAnalysis: PostCallAnalysis[] = (json.post_call_analysis_data || []).map((item: any) => ({
    name: item.name || '',
    description: item.description || '',
    type: item.type || 'string',
    choices: item.choices,
    examples: item.examples,
  }));
  
  return {
    id,
    name,
    description,
    settings,
    nodes,
    tools,
    postCallAnalysis,
    globalPrompt,
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
    const sanitizedName = node.name.replace(/[^\w\s]/g, '').substring(0, 25);
    const sanitizedId = node.id.replace(/-/g, '_');
    
    let nodeShape: string;
    if (node.type === 'end') {
      nodeShape = `([${sanitizedName}])`;
    } else if (node.id.includes('start')) {
      nodeShape = `((${sanitizedName}))`;
    } else if (node.type === 'branch') {
      nodeShape = `{${sanitizedName}}`;
    } else if (node.type === 'function') {
      nodeShape = `[/${sanitizedName}/]`;
    } else {
      nodeShape = `[${sanitizedName}]`;
    }
    lines.push(`  ${sanitizedId}${nodeShape}`);
  });
  
  // Add connections
  parsed.nodes.forEach((node) => {
    const sanitizedSourceId = node.id.replace(/-/g, '_');
    node.next.forEach((connection) => {
      if (!connection.targetNodeId) return;
      const sanitizedTargetId = connection.targetNodeId.replace(/-/g, '_');
      const conditionLabel = connection.condition !== 'default' && connection.condition !== 'Else'
        ? `|${connection.condition.replace(/[^\w\s]/g, '').substring(0, 15)}|` 
        : connection.condition === 'Else' ? '|Else|' : '';
      lines.push(`  ${sanitizedSourceId} -->${conditionLabel} ${sanitizedTargetId}`);
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
    lines.push(`| **Version/Description** | ${parsed.description} |`);
  }
  
  // Settings
  if (Object.keys(parsed.settings).length > 0) {
    lines.push('');
    lines.push('### Settings');
    lines.push('');
    lines.push(`| Setting | Value |`);
    lines.push(`|---------|-------|`);
    Object.entries(parsed.settings).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      lines.push(`| **${formattedKey}** | ${value} |`);
    });
  }
  
  // Global Prompt
  if (parsed.globalPrompt) {
    lines.push('');
    lines.push('## Global Prompt');
    lines.push('');
    lines.push('```');
    lines.push(parsed.globalPrompt);
    lines.push('```');
  }
  
  lines.push('');
  
  // Nodes
  lines.push('## Conversation Flow Nodes');
  lines.push('');
  
  if (parsed.nodes.length === 0) {
    lines.push('*No nodes found in this agent.*');
  } else {
    lines.push(`Total nodes: ${parsed.nodes.length}`);
    lines.push('');
    lines.push('| Node ID | Name | Type | Next Nodes |');
    lines.push('|---------|------|------|------------|');
    
    parsed.nodes.forEach((node) => {
      const nextNodes = node.next.length > 0 
        ? node.next.map(n => `${n.condition} → \`${n.targetNodeId}\``).join('; ') 
        : '—';
      
      lines.push(`| \`${node.id}\` | ${node.name} | ${node.type} | ${nextNodes} |`);
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
  
  // Detailed node prompts
  if (parsed.nodes.some(n => n.prompt)) {
    lines.push('## Node Prompts');
    lines.push('');
    
    parsed.nodes.forEach((node) => {
      if (node.prompt) {
        lines.push(`### ${node.name}`);
        lines.push(`**ID:** \`${node.id}\` | **Type:** ${node.type}`);
        lines.push('');
        lines.push('```');
        lines.push(node.prompt);
        lines.push('```');
        lines.push('');
      }
    });
  }
  
  // Tools
  if (parsed.tools.length > 0) {
    lines.push('## Tools');
    lines.push('');
    lines.push('| Tool ID | Name | Type | Description |');
    lines.push('|---------|------|------|-------------|');
    parsed.tools.forEach((tool) => {
      lines.push(`| \`${tool.id}\` | ${tool.name} | ${tool.type} | ${tool.description} |`);
    });
    lines.push('');
  }
  
  // Post-call analysis
  if (parsed.postCallAnalysis.length > 0) {
    lines.push('## Post-Call Analysis Fields');
    lines.push('');
    lines.push('| Field | Type | Description | Options/Examples |');
    lines.push('|-------|------|-------------|------------------|');
    parsed.postCallAnalysis.forEach((field) => {
      const options = field.choices?.join(', ') || field.examples?.join(', ') || '—';
      lines.push(`| ${field.name} | ${field.type} | ${field.description} | ${options} |`);
    });
    lines.push('');
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
 */
export function generateHtml(parsed: ParsedAgent, mermaidSvg?: string): string {
  const settingsRows = Object.entries(parsed.settings)
    .map(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return `<tr><td><strong>${formattedKey}</strong></td><td>${value}</td></tr>`;
    })
    .join('');
  
  const nodesRows = parsed.nodes.map((node) => {
    const promptPreview = node.prompt.length > 150 
      ? node.prompt.substring(0, 150) + '...' 
      : node.prompt;
    const nextNodes = node.next.length > 0 
      ? node.next.map(n => `<span class="next-node">${n.condition} → ${n.targetNodeId}</span>`).join('<br>') 
      : '—';
    
    return `
      <tr>
        <td><code>${node.id}</code></td>
        <td>${node.name}</td>
        <td><span class="node-type node-type-${node.type}">${node.type}</span></td>
        <td class="prompt-cell">${promptPreview.replace(/\n/g, '<br>')}</td>
        <td>${nextNodes}</td>
      </tr>
    `;
  }).join('');
  
  const detailedPrompts = parsed.nodes
    .filter(n => n.prompt)
    .map((node) => `
      <div class="prompt-detail">
        <h4>${node.name} <code>${node.id}</code> <span class="node-type node-type-${node.type}">${node.type}</span></h4>
        <pre>${node.prompt}</pre>
      </div>
    `).join('');
  
  const toolsSection = parsed.tools.length > 0 ? `
    <h2>Tools</h2>
    <table>
      <thead>
        <tr>
          <th>Tool ID</th>
          <th>Name</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${parsed.tools.map(tool => `
          <tr>
            <td><code>${tool.id}</code></td>
            <td>${tool.name}</td>
            <td><span class="tool-type">${tool.type}</span></td>
            <td>${tool.description}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';
  
  const postCallSection = parsed.postCallAnalysis.length > 0 ? `
    <h2>Post-Call Analysis Fields</h2>
    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Description</th>
          <th>Options/Examples</th>
        </tr>
      </thead>
      <tbody>
        ${parsed.postCallAnalysis.map(field => `
          <tr>
            <td><strong>${field.name}</strong></td>
            <td><span class="field-type">${field.type}</span></td>
            <td>${field.description}</td>
            <td>${field.choices?.join(', ') || field.examples?.join(', ') || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';
  
  const globalPromptSection = parsed.globalPrompt ? `
    <h2>Global Prompt</h2>
    <div class="global-prompt">
      <pre>${parsed.globalPrompt}</pre>
    </div>
  ` : '';
  
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
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #1db9a0; }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; color: #e7e9ea; border-bottom: 1px solid #2f3336; padding-bottom: 0.5rem; }
    h3 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; color: #8899a6; }
    h4 { font-size: 1rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #2f3336; }
    th { background: #1a1f26; color: #8899a6; font-weight: 600; }
    tr:hover td { background: rgba(29, 185, 160, 0.05); }
    code { background: #1a1f26; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #1db9a0; word-break: break-all; }
    pre { background: #1a1f26; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.8rem; white-space: pre-wrap; line-height: 1.5; }
    .node-type { background: #2f3336; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; text-transform: uppercase; }
    .node-type-conversation { background: rgba(29, 185, 160, 0.2); color: #1db9a0; }
    .node-type-branch { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
    .node-type-function { background: rgba(138, 43, 226, 0.2); color: #ba68c8; }
    .node-type-end { background: rgba(244, 67, 54, 0.2); color: #f44336; }
    .tool-type, .field-type { background: #2f3336; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem; }
    .next-node { background: rgba(29, 185, 160, 0.15); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem; display: inline-block; margin: 0.1rem 0; }
    .prompt-cell { max-width: 400px; font-size: 0.8rem; color: #8899a6; }
    .prompt-detail { margin: 1rem 0; padding: 1rem; background: #1a1f26; border-radius: 8px; border-left: 3px solid #1db9a0; }
    .prompt-detail h4 { color: #e7e9ea; }
    .prompt-detail code { margin-left: 0.5rem; }
    .prompt-detail pre { margin-top: 0.75rem; background: #0f1419; }
    .global-prompt { background: #1a1f26; border-radius: 8px; padding: 1rem; border-left: 3px solid #ffc107; }
    .global-prompt pre { background: transparent; padding: 0; }
    .mermaid-container { background: #1a1f26; padding: 2rem; border-radius: 8px; margin: 1rem 0; overflow-x: auto; }
    .mermaid { background: transparent; }
    details { margin: 1rem 0; }
    summary { cursor: pointer; color: #1db9a0; font-weight: 500; }
    details pre { margin-top: 1rem; max-height: 500px; overflow-y: auto; }
    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem; }
    .badge-version { background: rgba(29, 185, 160, 0.2); color: #1db9a0; }
    @media (max-width: 768px) {
      body { padding: 1rem; }
      table { display: block; overflow-x: auto; }
      h1 { font-size: 1.5rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${parsed.name} ${parsed.description ? `<span class="badge badge-version">${parsed.description}</span>` : ''}</h1>
    
    <h2>Agent Overview</h2>
    <table>
      <tr><td><strong>Agent ID</strong></td><td><code>${parsed.id}</code></td></tr>
      <tr><td><strong>Name</strong></td><td>${parsed.name}</td></tr>
      ${parsed.description ? `<tr><td><strong>Version</strong></td><td>${parsed.description}</td></tr>` : ''}
    </table>
    
    ${Object.keys(parsed.settings).length > 0 ? `
      <h3>Configuration</h3>
      <table>
        ${settingsRows}
      </table>
    ` : ''}
    
    ${globalPromptSection}
    
    <h2>Conversation Flow</h2>
    <p style="color: #8899a6; margin-bottom: 1rem;">Total nodes: ${parsed.nodes.length}</p>
    ${parsed.nodes.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Node ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Prompt Preview</th>
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
      <h2>Detailed Node Prompts</h2>
      ${detailedPrompts}
    ` : ''}
    
    ${toolsSection}
    
    ${postCallSection}
    
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
