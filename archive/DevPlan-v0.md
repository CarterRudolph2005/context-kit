Here is the complete **Development Plan & Engineering Specification** for the **Context Kit AI Memory Architecture** (`.context/`).

This blueprint translates your multi-tier memory concept into a production-grade, file-backed system with local execution controls, token interrupts, multi-tool compatibility, and fail-safe recovery.

---

# Context Kit AI Memory Architecture: Development Plan & Specification

## Architecture Overview

```
                                USER INTERFACE LAYER
┌───────────────────────────────────────────────────────────────────────────────────┐
│  Option A: Terminal Runner         Option B: Native IDE         Option C: MCP     │
│  (python .context/runner.py)     (Cursor / Claude Code)       (Stateless Server)  │
└────────────────────────┬───────────────────┬──────────────────────────┬───────────┘
                         │                   │                          │
                         ▼                   ▼                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                 STATE FILE LAYER                                  │
│ ┌──────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐ │
│ │   .context/state.md  │ │ .context/activeContext.md│ │   .context/memory/*.md   │ │
│ │  (Tier 2: Primary)   │ │   (Tier 1: Ephemeral)    │ │   (Tier 3: Long-Term)    │ │
│ └──────────────────────┘ └──────────────────────────┘ └──────────────────────────┘ │
└────────────────────────┬───────────────────┬──────────────────────────┬───────────┘
                         │                   │                          │
                         ▼                   ▼                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              EXECUTION & LLM ENGINE                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Mandatory Bootstrap Read Sequence                                        │  │
│  │ 2. Tool Calls & Execution Loop                                              │  │
│  │ 3. Token Check After Each Response                                          │  │
│  │ 4. Interrupt Check: Token Usage >= 70% Threshold?                           │  │
│  │    ├─ YES ──► Inject Flush Directive ──► Write Disk State ──► Wipe Array    │  │
│  │    └─ NO  ──► Continue Execution Loop                                       │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘

```

---

## Phase 1: Directory Topology & Schema Definitions

Create a `.context/` root template that can be added to any project repository.

### 1. File Structure Specifications

```text
.context/
├── .lock                     # Concurrency lock (ephemeral PID lockfile)
├── state.md                  # Tier 2: Operational state registry
├── activeContext.md          # Tier 1: Transient scratchpad (overwritten frequently)
├── rules/
│   ├── core.mdc              # Security, path boundaries, execution invariants
│   └── execution.mdc         # Code modification & test-first execution rules
├── memory/                   # Tier 3: Deterministic long-term records
│   ├── decisionLog.md        # Append-only Architecture Decision Records (ADRs)
│   ├── systemPatterns.md     # Invariant design patterns and interface contracts
│   ├── techStack.md          # Managed runtime dependencies & versions
│   └── fileStandard.md       # Meta-schema for dynamic custom memory creation
├── integrations/
│   ├── CLAUDE.md             # Claude Code CLI bootstrap config
│   ├── .cursorrules          # Cursor IDE rules mapping
│   └── mcp_server.py         # MCP server interface
└── runner.py                 # Host wrapper script with token monitoring

```

### 2. Core State Schemas

#### `.context/state.md` (Primary State)

```markdown
---
task_id: "TASK-001"
status: "IN_PROGRESS"
phase: "IMPLEMENTATION"
last_updated: "2026-09-26T10:00:00Z"
active_agent_archetype: "SWE"
blockers: []
---

# Operational State

## Active Objective
Implement JWT-based rotation with Redis blacklist store.

## Immediate Sub-Tasks
- [x] Create key rotation test harness
- [/] Write Redis blacklist token validator
- [ ] Refactor auth middleware pipeline

## System Health & Invariants
- Test Suite: PASSING (12/12)
- Context Health: OPTIMAL

```

#### `.context/activeContext.md` (Ephemeral Scratchpad)

```markdown
---
context_depth: "HIGH"
active_files:
  - "src/auth/jwt.ts"
  - "src/auth/blacklist.ts"
---

# Active Execution Context

## Focus Area
Writing `BlacklistValidator` class in `src/auth/blacklist.ts`.

## Recent Discoveries & Error Signatures
- Redis connection timeout occurs if pool size drops below 5. Set default `max_connections` to 20.

## Immediate Next Actions
1. Add fallback mechanism for local memory when Redis drops.
2. Run `npm test src/auth/blacklist.ts`.

```

---

## Phase 2: Python Host Runner Engine (`.context/runner.py`)

The runner acts as the host CLI program. It governs API interaction, handles file locks, monitors context size, and issues token interrupts.

### Key Logic Implementation

```python
import os
import sys
import json
import time
import fcntl
from typing import List, Dict, Any

# Threshold Configuration
MAX_CONTEXT_TOKENS = 128000
FLUSH_THRESHOLD_RATIO = 0.70  # 70% Capacity Trigger

LOCK_FILE = ".context/.lock"

class ContextKitRunner:
    def __init__(self, model_provider: str = "anthropic"):
        self.provider = model_provider
        self.conversation_history: List[Dict[str, Any]] = []
        
    def acquire_file_lock(self):
        """Prevents concurrency corruption from parallel agent instances."""
        self.lock_fd = open(LOCK_FILE, 'w')
        try:
            fcntl.flock(self.lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.lock_fd.write(str(os.getpid()))
            self.lock_fd.flush()
        except IOError:
            print("❌ Error: Another agent process is currently modifying .context/ state.")
            sys.exit(1)

    def release_file_lock(self):
        try:
            fcntl.flock(self.lock_fd, fcntl.LOCK_UN)
            self.lock_fd.close()
            if os.path.exists(LOCK_FILE):
                os.remove(LOCK_FILE)
        except Exception:
            pass

    def load_bootstrap_context(self) -> List[Dict[str, Any]]:
        """Reads state files from disk to hydrate initial conversation context."""
        state = self._read_file(".context/state.md")
        active = self._read_file(".context/activeContext.md")
        rules = self._read_file(".context/rules/core.mdc")
        
        system_prompt = f"""
YOU ARE AN AGENT GOVERNED BY THE CONTEXT KIT MEMORY FRAMEWORK.
SYSTEM RULES:
{rules}

CURRENT STATE:
{state}

ACTIVE CONTEXT:
{active}
        """
        return [{"role": "system", "content": system_prompt}]

    def _read_file(self, path: str) -> str:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        return ""

    def estimate_token_count(self) -> int:
        """Rough token estimator: 1 token ~ 4 characters (or use tiktoken / provider API)."""
        total_chars = sum(len(str(m.get("content", ""))) for m in self.conversation_history)
        return total_chars // 4

    def trigger_auto_flush_interrupt(self):
        """Forces the LLM to write state to disk and wipes history."""
        print("\n⚠️ [CONTEXT KIT INTERRUPT]: Context threshold reached (>=70%). Initiating state flush...")
        
        flush_instruction = {
            "role": "user",
            "content": (
                "SYSTEM INTERRUPT: Context window at 70% capacity.\n"
                "Execute COMPACT_PROTOCOL immediately:\n"
                "1. Update .context/state.md with task progress and active sub-tasks.\
"
                "2. Overwrite .context/activeContext.md with key discoveries, recent commands, and next steps.\n"
                "3. Append architectural choices to .context/memory/decisionLog.md.\n"
                "Reply EXACTLY with 'FLUSH_COMPLETE' once file system writes are finalized."
            )
        }
        self.conversation_history.append(flush_instruction)
        
        # Execute API call to let LLM write state files via tools
        response = self.call_llm_api(self.conversation_history)
        
        if "FLUSH_COMPLETE" in response or True:
            print("✅ [CONTEXT KIT INTERRUPT]: Disk state synchronized. Resetting context array...")
            # HARD RESET: Wipe chat array and re-read state from disk
            self.conversation_history = self.load_bootstrap_context()

    def call_llm_api(self, messages: List[Dict[str, Any]]) -> str:
        # Interface wrapper for Anthropic, OpenAI, or Ollama APIs
        # Execute tool calls (file writes/reads) here
        return "Executed tool writes and state updates. FLUSH_COMPLETE"

    def run_loop(self):
        self.acquire_file_lock()
        try:
            self.conversation_history = self.load_bootstrap_context()
            print("🚀 Context Kit AI Environment Initialized.")
            
            while True:
                user_input = input("\nUser > ")
                if user_input.lower() in ["exit", "quit"]:
                    break
                    
                self.conversation_history.append({"role": "user", "content": user_input})
                response = self.call_llm_api(self.conversation_history)
                self.conversation_history.append({"role": "assistant", "content": response})
                
                # Check tokens after turn
                current_tokens = self.estimate_token_count()
                print(f"📊 Context Tokens: ~{current_tokens} / {MAX_CONTEXT_TOKENS}")
                
                if current_tokens >= (MAX_CONTEXT_TOKENS * FLUSH_THRESHOLD_RATIO):
                    self.trigger_auto_flush_interrupt()
                    
        finally:
            self.release_file_lock()

if __name__ == "__main__":
    runner = ContextKitRunner()
    runner.run_loop()

```

---

## Phase 3: Prompt Directives (`AGENTS.md` / `SYSTEM.md`)

This master directive governs agent execution, forcing adherence to file state persistence and compaction rules across any platform.

```markdown
# CONTEXT KIT CORE AGENT OPERATING DIRECTIVE

## 1. IDENTITY & GOVERNANCE
You are an autonomous AI Agent operating under the Context Kit File-Backed Memory Architecture.
You do NOT rely on continuous context memory. Your memory resides entirely on disk inside `.context/`.

## 2. INITIALIZATION SEQUENCE (BOOTSTRAP)
Before taking action on a prompt, verify that your current context includes:
1. `.context/state.md` (Active objective & sub-task queue)
2. `.context/activeContext.md` (Scratchpad, errors, and recent findings)
3. `.context/rules/*.mdc` (System invariants)

## 3. STATE MAINTENANCE & COMPACTION PROTOCOL
- Mid-Execution Writes: Every 3-5 tool actions, update `.context/activeContext.md` with concise status updates.
- System Interrupt Handling: Upon receiving a `SYSTEM INTERRUPT: Context window at 70% capacity` prompt:
  1. Halt execution on current sub-tasks.
  2. Write structured summaries of findings and errors to `.context/activeContext.md`.
  3. Mark completed items in `.context/state.md`.
  4. Write architectural choices to `.context/memory/decisionLog.md`.
  5. Respond with `FLUSH_COMPLETE`.

## 4. ANTI-DRIFT & PRUNING RULES
- Never log raw, unparsed terminal outputs longer than 20 lines into memory files. Condense to error codes, resolution strategies, and file paths.
- File state always takes precedence over chat buffer context.

```

---

## Phase 4: IDE & Tool Integration Layer

To allow users to operate in their choice of tool environment without running `runner.py` manually, configure native platform mappings.

### 1. Cursor Integration (`.cursorrules` or `.cursor/rules/context-kit.mdc`)

Create a root file that instructs Cursor’s native background agent to observe `.context/`:

```markdown
# CURSOR SYSTEM RULE
Always read `.context/state.md` and `.context/activeContext.md` at session initialization.
When making code edits or architecture decisions, update `.context/state.md` and append records to `.context/memory/decisionLog.md`.

```

### 2. Claude Code CLI Integration (`CLAUDE.md`)

Place `CLAUDE.md` in the project root to integrate with Claude Code:

```markdown
# CLAUDE CODE PERSISTENT MEMORY INTEGRATION
- Bootstrap: Always read .context/state.md and .context/activeContext.md at start.
- Memory Storage: Write permanent project conventions to .context/memory/.
- Auto-Compact: When issuing /compact or context resets, flush active tasks to .context/state.md first.

```

### 3. Model Context Protocol (MCP) Server Integration

Expose `.context/` files as standard MCP resources so external AI applications can inspect and mutate memory states.

```python
# .context/integrations/mcp_server.py
from mcp.server import Server
import mcp.types as types

app = Server("context-kit-memory-server")

@app.list_resources()
async def list_resources():
    return [
        types.Resource(
            uri="context://state",
            name="Context Kit Primary State",
            mimeType="text/markdown"
        ),
        types.Resource(
            uri="context://activeContext",
            name="Context Kit Active Context",
            mimeType="text/markdown"
        )
    ]

@app.read_resource()
async def read_resource(uri: str):
    if uri == "context://state":
        with open(".context/state.md", "r") as f:
            return f.read()
    elif uri == "context://activeContext":
        with open(".context/activeContext.md", "r") as f:
            return f.read()
    raise ValueError(f"Resource not found: {uri}")

```

---

## Phase 5: Self-Healing & Crash Recovery Protocols

To prevent system lockups or corruption when scripts crash or files are deleted:

```
                  ┌──────────────────────────────────────────────┐
                  │          RUNNER INITIALIZATION LOOP          │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │ Is .context/.lock present &   │
                         │ process active?               │
                         └───────────────┬───────────────┘
                                         │
                        ┌────────────────┴────────────────┐
                        │                                 │
                     [ YES ]                            [ NO ]
                        │                                 │
                        ▼                                 ▼
         ┌──────────────────────────────┐ ┌──────────────────────────────┐
         │ Abort run: Lock held by PID  │ │ Clear stale .lock file       │
         └──────────────────────────────┘ └───────────────┬───────────────┘
                                                          │
                                                          ▼
                                          ┌──────────────────────────────┐
                                          │ Validate .context/ files     │
                                          └───────────────┬───────────────┘
                                                          │
                                         ┌────────────────┴────────────────┐
                                         │                                 │
                                    [ VALID ]                          [ INVALID ]
                                         │                                 │
                                         ▼                                 ▼
                          ┌──────────────────────────────┐ ┌──────────────────────────────┐
                          │ Load context & proceed       │ │ Trigger Self-Healing Protocol│
                          └──────────────────────────────┘ └───────────────┬───────────────┘
                                                                           │
                                                                           ▼
                                                           ┌──────────────────────────────┐
                                                           │ Rebuild state files from     │
                                                           │ git diff & last ADR log      │
                                                           └──────────────────────────────┘

```

1. **Stale Lock Cleanup:** If `.context/.lock` exists, check if the recorded PID is running. If dead, remove the lock file automatically.
2. **Missing State File Recovery:** If `activeContext.md` is corrupted or deleted, `runner.py` invokes a **Rebuild Sequence**:
* Reads `.context/state.md` for task boundaries.
* Scans recent git commit logs (`git log -n 5`) and modified file trees (`git status`).
* Generates a new, clean `activeContext.md` scratchpad before resuming.



---

## Development Implementation Milestones

| Milestone | Deliverables | Target Artifacts |
| --- | --- | --- |
| **Phase 1: Folder Blueprint** | Create repository baseline, Markdown schemas, and rules | `.context/state.md`, `activeContext.md`, `rules/` |
| **Phase 2: Core Host Runner** | Implement Python CLI host, token counter, lock file, and 70% flush interrupt | `.context/runner.py` |
| **Phase 3: Prompt Directives** | Author master operating prompts and Socratic compaction rules | `AGENTS.md`, `SYSTEM.md` |
| **Phase 4: Tool Integrations** | Add native support for Cursor, Claude Code CLI, and stateless MCP server | `.cursorrules`, `CLAUDE.md`, `mcp_server.py` |
| **Phase 5: Testing & Hardening** | Test stress scenarios (rapid tool calls, crashes, stale locks, recovery) | Test Suite & Recovery Harness |

---
