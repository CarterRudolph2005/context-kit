Setting up this project step-by-step is straightforward. You will initialize a new Angular project, install `jszip` and `file-saver` (the libraries that compile files and trigger browser downloads), create your Angular services, and deploy to Vercel.

  

### Step 1: Initialize Your Angular Workspace

Open your terminal and run:

  

Bash

```
# 1. Install Angular CLI globally (if not already installed)
npm install -g @angular/cli

# 2. Create a new standalone Angular app (replace 'context-generator' with your project name)
ng new context-generator --style=css --ssr=false

# 3. Move into your new project directory
cd context-generator
```

### Step 2: Install Client-Side File Packaging Libraries

Install `jszip` (to build `.zip` files in memory) and `file-saver` (to trigger downloads in the browser), alongside their TypeScript definitions:

  

Bash

```
npm install jszip file-saver
npm install --save-dev @types/file-saver
```

### Step 3: Create the Angular Core Services

Generate two Angular services using the Angular CLI:

  

Bash

```
# Service 1: Injects user answers into Markdown file templates
ng generate service core/services/template-compiler

# Service 2: Takes compiled strings, zips them, and triggers download
ng generate service core/services/zip-generator
```

#### 1. Implement `template-compiler.service.ts`

TypeScript

```
// src/app/core/services/template-compiler.service.ts
import { Injectable } from '@angular/core';

export interface SurveyData {
  projectName: string;
  objective: string;
  techStack: string;
  tokenLimit: number;
  autoFlushThreshold: number;
  targetTools: string[]; // e.g., ['cursor', 'claudeCode']
}

@Injectable({
  providedIn: 'root'
})
export class TemplateCompilerService {
  compile(data: SurveyData) {
    return {
      stateMd: this.getCompiledStateMd(data),
      activeContextMd: this.getCompiledActiveContextMd(data),
      agentsMd: this.getCompiledAgentsMd(data),
      runnerPy: this.getCompiledRunnerPy(data)
    };
  }

  private getCompiledStateMd(data: SurveyData): string {
    return `---
task_id: "TASK-001"
status: "IN_PROGRESS"
last_updated: "${new Date().toISOString()}"
---

# Operational State: ${data.projectName}

## Active Objective
${data.objective}

## Managed Tech Stack Invariants
${data.techStack}
`;
  }

  private getCompiledActiveContextMd(data: SurveyData): string {
    return `# Active Execution Context

## Focus Area
Initializing project structure and baseline workspace rules.

## Immediate Next Actions
1. Review generated invariants in .context/state.md.
2. Execute initial tool steps.
`;
  }

  private getCompiledAgentsMd(data: SurveyData): string {
    return `# AGENT OPERATING DIRECTIVE: ${data.projectName}

You are an autonomous AI Agent operating under the File-Backed Memory Architecture.
- Token Limit: ${data.tokenLimit}
- Auto-Flush Trigger: ${data.autoFlushThreshold}%

1. Always read .context/state.md and .context/activeContext.md at start.
2. When context token usage hits ${data.autoFlushThreshold}%, execute COMPACT_PROTOCOL and flush active notes to disk.
`;
  }

  private getCompiledRunnerPy(data: SurveyData): string {
    return `# Host runner script for ${data.projectName}
MAX_TOKENS = ${data.tokenLimit}
FLUSH_THRESHOLD = ${data.autoFlushThreshold / 100}

print("Starting Context Kit Memory Runner for ${data.projectName}...")
`;
  }
}
```

#### 2. Implement `zip-generator.service.ts`

TypeScript

```
// src/app/core/services/zip-generator.service.ts
import { Injectable, inject } from '@angular/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { TemplateCompilerService, SurveyData } from './template-compiler.service';

@Injectable({
  providedIn: 'root'
})
export class ZipGeneratorService {
  private compiler = inject(TemplateCompilerService);

  async downloadZip(data: SurveyData): Promise<void> {
    const zip = new JSZip();
    const folder = zip.folder('.context');

    const files = this.compiler.compile(data);

    // Populate Markdown and script files inside .context/
    folder?.file('state.md', files.stateMd);
    folder?.file('activeContext.md', files.activeContextMd);
    folder?.file('AGENTS.md', files.agentsMd);
    folder?.file('runner.py', files.runnerPy);

    // Build zip file in browser memory and prompt download
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${data.projectName || 'project'}-context.zip`);
  }
}
```

### Step 4: Run Your Project Locally

Start your Angular dev server:

  

Bash

```
ng serve
```

Navigate to `http://localhost:4200` in your browser. You can now connect this service to a simple template form with inputs for `projectName`, `objective`, `techStack`, and a download button that calls `zipGenerator.downloadZip(formData)`.

  

### Step 5: Deploy Free to Vercel

When your code is pushed to a GitHub repository:

  

1. Log into **Vercel** and click **New Project**.
    
      
    
2. Select your `context-generator` GitHub repository.
    
      
    
3. Vercel automatically detects **Angular**:
    
      
    - **Framework Preset:** `Angular`
        
          
        
    - **Build Command:** `ng build`
        
          
        
    - **Output Directory:** `dist/context-generator/browser`
        
          
        
4. Click **Deploy**. Your live site URL will be ready in under 60 seconds!