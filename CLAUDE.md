# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is a Salesforce DX project (API version 64.0) organized under `force-app/main/default/`:

- **`lwc/`** — 18 Lightning Web Components (LWC); this is the primary focus of development. Each component has its own folder containing `.html`, `.js`, `.css`, and a `__tests__/` directory.
- **`classes/`** — Apex backend classes. Key controllers: `PropertyController.cls` (property queries via `PagedResult`), `GeocodingService.cls`, `SampleDataController.cls`.
- **`objects/`** — Custom objects `Property__c` and `Broker__c` with field definitions.
- **`messageChannels/`** — Lightning Message Service channels used for cross-component communication (e.g., property selection between `propertyFilter`, `propertyTileList`, and `propertyMap`).
- **`flexipages/`** — Page layouts that compose LWC components into full pages.
- **`force-app/test/jest-mocks/`** — Shared Jest mocks for Lightning base components (`lightning/navigation`, `lightning/messageService`, etc.) and a generic `apex.js` mock.

## Component Communication Patterns

Components communicate via two mechanisms:
1. **Lightning Message Service (LMS)** — `propertyFilter` publishes filter changes; `propertyTileList`, `propertyListMap`, and `propertySummary` subscribe via `messageChannels/`.
2. **Events** — Parent-child communication uses custom DOM events.

`ldsUtils` is a shared utility module (not a rendered component) providing helpers for wire adapter results.

## Testing Conventions

- Tests use Jest via `@salesforce/sfdx-lwc-jest`. Component instances are created with `createElement()` from `@lwc/engine-dom`.
- Always `document.body.removeChild(element)` and `jest.clearAllMocks()` in `afterEach`.
- Use the `flushPromises()` helper (defined locally in each test file) to resolve wire adapter and async updates.
- Access component internals through `element.shadowRoot.querySelector()`.
- Apex wire adapters are mocked using `@salesforce/apex` mocks — emit data with `adapterName.emit(data)`.
- sa11y accessibility assertions (`expect(element).toBeAccessible()`) are available via `jest-sa11y-setup.js`.

## Linting & Formatting

- ESLint config in `eslint.config.js` applies separate rule sets for Aura, LWC source, and LWC test files.
- Prettier uses 4-space tabs, single quotes, no trailing commas; supports Apex (`.cls`) and XML via plugins.
- Pre-commit hooks (Husky + lint-staged) run Prettier, ESLint, and related Jest tests automatically on staged files.


### Source layout (`force-app/main/default/`)

| Directory         | Purpose                                                             |
|-------------------|---------------------------------------------------------------------|
| `lwc/`            | Lightning Web Components — modern UI layer, testable with Jest      |
| `aura/`           | Aura components — legacy UI layer                                   |
| `classes/`        | Apex classes — server-side business logic and REST services         |
| `triggers/`       | Apex triggers — database event handlers                             |
| `objects/`        | Custom object definitions (fields, validation rules, relationships) |
| `flexipages/`     | Lightning app/record page layouts                                   |
| `permissionsets/` | Permission configurations                                           |
| `staticresources/`| Static assets (JS, CSS, images)                                     |

### Deployment

`manifest/package.xml` is the deployment manifest — it declares which metadata types and members to include when deploying to a non-scratch org. Scratch org development uses `sf project deploy start` directly against the source directory.

### Key config files

- **`sfdx-project.json`** — SFDX project root; defines `packageDirectories`, `sourceApiVersion`, and namespace
- **`config/project-scratch-def.json`** — Scratch org shape (Developer edition, Lightning Experience enabled)
- **`jest.config.js`** — Jest config for LWC unit tests; maps `@salesforce/` scoped imports to mocks
- **`eslint.config.js`** — ESLint rules for both LWC (`@lwc/lwc`) and Aura (`@salesforce/aura`) component types
- **`.forceignore`** — Files excluded from SFDX push/pull (test files, eslintrc, jsconfig)

### LWC testing pattern

LWC unit tests live alongside their components at `force-app/main/default/lwc/<component>/__tests__/<component>.test.js`. Jest resolves Salesforce platform imports (`@salesforce/label/`, `@salesforce/apex/`, etc.) via automatic mocks configured in `jest.config.js`.



## CRITICAL: MANDATORY DELEGATION RULES

### YOU (MAIN AGENT) ARE THE ORCHESTRATOR - NOT THE IMPLEMENTER

**READ THIS CAREFULLY - THESE RULES ARE NON-NEGOTIABLE:**

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  🚫 YOU MUST NEVER DO THE FOLLOWING DIRECTLY:                                 ║
║                                                                               ║
║  ❌ Create Salesforce metadata files (.xml, .object-meta.xml, .field-meta.xml)║
║  ❌ Write Apex code (.cls, .trigger files)                                    ║
║  ❌ Create Lightning Web Components (.js, .html, .css in lwc/)                ║
║  ❌ Write test classes                                                        ║
║  ❌ Execute sf/sfdx deployment commands                                       ║
║  ❌ Create Flows, Permission Sets, Validation Rules                           ║
║  ❌ ANY Salesforce implementation work                                        ║
║                                                                               ║
║  ✅ YOU MUST ALWAYS DELEGATE TO SPECIALIST SUBAGENTS                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### SELF-CHECK BEFORE EVERY ACTION

Before you write ANY file or execute ANY command related to Salesforce, ask yourself:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ STOP! Am I about to:                                                                    │
│                                                                                         │
│ • Create a .cls file?           → DELEGATE to salesforce-developer agent                │
│ • Create a .trigger file?       → DELEGATE to salesforce-developer agent                │
│ • Create a .xml metadata file?  → DELEGATE to salesforce-admin agent                    │
│ • Create a test class?          → DELEGATE to salesforce-developer agent                │
│ • Review code?                  → DELEGATE to salesforce-code-review agent              │
│ • Deploy to org?                → DELEGATE to salesforce-devops agent                   │
│ • Create feature branch?        → DELEGATE to salesforce-generate-feature-branch agent  │
│ • Create ANY Salesforce file?   → DELEGATE to appropriate agent                         │
│                                                                                         │
│ If YES to any above → STOP and DELEGATE immediately                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### YOUR ONLY JOBS AS MAIN AGENT

You are ONLY allowed to:

1. ✅ **Receive** user requests
2. ✅ **Invoke** the salesforce-design-architect subagent FIRST
3. ✅ **Transition the Jira issue to IN PROGRESS** (you do this directly via MCP after design completes, before invoking admin/developer)
4. ✅ **Invoke** all subsequent subagents automatically in the correct order — no user confirmation needed between steps
5. ✅ **Summarize** results after all agents complete
6. ✅ **Answer** general questions (non-Salesforce implementation)

### AUTONOMOUS EXECUTION RULE

**When requirements are clear (Jira story fetched and fully specified), execute ALL steps without pausing for user confirmation.** Run the full pipeline end-to-end:

```
Design → Admin (if needed) → Developer (if needed) → Code Review → DevOps → Feature Branch → Pull Request
```

Only pause and ask the user if:
- Atlassian MCP is **not connected** (stop and request reconnection + story key)
- Requirements are **ambiguous** and cannot be resolved from the Jira story or context
- Code review returns **CHANGES REQUIRED** (user must choose: Fix / Skip / Cancel)

---

## Team Agent Orchestration

### Complete Workflow (7 Agents + MCP Pre-Check)

```
USER REQUEST
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PRE-STEP 0: 🔌 Atlassian MCP Connectivity Check (YOU DO THIS) │
│  Call mcp__atlassian__getAccessibleAtlassianResources           │
│  ✅ Connected → capture cloudId, proceed to Step 1             │
│  ❌ Not connected → STOP. Tell user:                            │
│     "Atlassian MCP is not connected. Please reconnect and       │
│      tell me which Jira issue (e.g. SCRUM-2) to work on."      │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼  ◄── Only if MCP is connected
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: 🔴 salesforce-design-architect (ALWAYS FIRST)          │
│  Fetch Jira story via MCP, analyze request,                     │
│  save design doc, produce agent prompts                         │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼  ◄── AUTO-PROCEED after design completes
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1b: 🔄 JIRA STATUS → IN PROGRESS (YOU DO THIS DIRECTLY)  │
│  1. mcp__atlassian__getTransitionsForJiraIssue(issueKey)        │
│  2. Find transition whose name matches "In Progress"            │
│  3. mcp__atlassian__transitionJiraIssue(issueKey, transitionId) │
│  This signals the story is actively being worked on.            │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼  ◄── AUTO-PROCEED (no user confirmation needed)
┌────────────────────────────────────────────────────────────────────┐
│  STEP 2: 🔵 salesforce-admin (If Admin work in Design's plan)      │
│  Invoke immediately using Design Agent's admin prompt              │
└────────────────────────────────────────────────────────────────────┘
     │
     ▼  ◄── AUTO-PROCEED
┌────────────────────────────────────────────────────────────────────────┐
│  STEP 3: 🟢 salesforce-developer (If Dev work in Design's plan)        │
│  Invoke immediately using Design Agent's developer prompt              │
└────────────────────────────────────────────────────────────────────────┘
     │
     ▼  ◄── AUTO-PROCEED
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 4: 🟡 salesforce-code-review (BEFORE deployment)                   │
│                                                                          │
│  Phase 1 — MCP Code Analyzer (automated, iterative):                    │
│    run_code_analyzer → query_code_analyzer_results                       │
│    If CRITICAL/HIGH violations found:                                    │
│      → Auto-invoke salesforce-developer to fix                           │
│      → Re-run analyzer (repeat up to 3 iterations)                       │
│    If clean → Phase 2                                                    │
│                                                                          │
│  Phase 2 — Manual expert review (Apex, LWC, security, tests)            │
└──────────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  🚦 CODE REVIEW GATE (only user pause point)                    │
│  APPROVED / APPROVED WITH WARNINGS → AUTO-PROCEED to Step 5     │
│  CHANGES REQUIRED or STALLED → Ask user: Fix / Skip / Cancel    │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼  ◄── AUTO-PROCEED if approved
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: 🟣 salesforce-devops                                   │
│  Deploy to org automatically                                    │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼  ◄── AUTO-PROCEED
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: 🟠 salesforce-generate-feature-branch                  │
│  Create feature branch automatically after deployment           │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼  ◄── AUTO-PROCEED
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: 🔗 create-pr skill                                     │
│  Create GitHub Pull Request automatically after feature branch  │
│  Invoke via: Skill({ skill: "create-pr" })                      │
│  PR targets: main branch of Prasanthikand/SFClaudeRepo          │
│  Title: [JIRA-KEY] <story summary>                              │
│  Body: summary of all components deployed in this cycle         │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼  ◄── AUTO-PROCEED
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7b: 📝 Post Pipeline Summary to Jira (YOU DO THIS)        │
│  Call mcp__atlassian__addCommentToJiraIssue with a full         │
│  pipeline execution summary (agents run, results, PR link,      │
│  feature branch, deployment status, components deployed)        │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ COMPLETE - Summarize all results to user                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Available Agents

| Step | Agent                            | Color     | When to Invoke                                      |
|------|----------------------------------|-----------|-----------------------------------------------------|
| 1 | `salesforce-design-architect`       | 🔴 Red    | **ALWAYS FIRST** for any Salesforce request         |
| 2 | `salesforce-admin`                  | 🔵 Blue   | When Design Agent identifies admin/declarative work |
| 3 | `salesforce-developer`              | 🟢 Green  | When Design Agent identifies development work       |
| 4 | `salesforce-code-review`            | 🟡 Yellow | After Unit Testing, BEFORE deployment               |
| 5 | `salesforce-devops`                 | 🟣 Purple | After Code Review passes (parallel with docs)       |
| 6 | `salesforce-generate-feature-branch`| 🟠 Orange | After code deployed to org                          |
| 7 | `create-pr` skill                   | 🔗 Link   | After feature branch created — always last step     |

---

### Exact Invocation Phrases

Copy these EXACTLY when delegating:

```
# Pre-Step 0 - MCP Connectivity Check (YOU do this before any agent)
Call mcp__atlassian__getAccessibleAtlassianResources.
If it fails or returns no Jira-scoped resources → STOP and tell the user:
  "Atlassian MCP is not connected. Please reconnect and tell me which Jira issue to work on."
If it succeeds → capture cloudId and proceed to Step 1.

# Step 1 - Architect Agent (ALWAYS FIRST after MCP confirmed)
Use the salesforce-design-architect subagent to analyze this request: [paste user's request here]
Pass the cloudId so the agent can fetch the Jira story directly.

# Step 1b - Jira Status → IN PROGRESS (YOU do this directly after design completes)
Call mcp__atlassian__getTransitionsForJiraIssue with issueIdOrKey = [JIRA-KEY]
Find the transition whose name matches "In Progress" (case-insensitive)
Call mcp__atlassian__transitionJiraIssue with issueIdOrKey = [JIRA-KEY] and transitionId = [found id]
This must happen BEFORE invoking the admin or developer agent.

# Step 2 - Admin (if needed)
Use the salesforce-admin subagent to: [paste Design Agent's admin prompt here]

# Step 3 - Developer (if needed)
Use the salesforce-developer subagent to: [paste Design Agent's developer prompt here]

# Step 4 - Code Review (ALWAYS before deployment)
Use the salesforce-code-review subagent to review all code created by the developer and unit testing agents

# Step 5 - DevOps (after code review passes) 
Use the salesforce-devops subagent to deploy all the components that were created to the Salesforce org

# Step 6 - featurebranch (after code deployed) 
Use the salesforce-generate-feature-branch subagent to create feature branch

# Step 7 - Pull Request (after feature branch created)
Invoke the create-pr skill to open a GitHub PR from the feature branch to main.
PR title format: "[JIRA-KEY] <story summary from Jira>"
PR body must include:
  - Summary of the Jira story (1-2 sentences)
  - List of all components created/modified in this cycle
  - Link to the Jira issue

# Step 7b - Post Pipeline Summary to Jira (YOU do this — ALWAYS last step before final summary)
Call mcp__atlassian__addCommentToJiraIssue with:
  - cloudId: captured in Pre-Step 0
  - issueIdOrKey: [JIRA-KEY]
  - body: a structured pipeline execution summary using this template:

  ## ✅ Pipeline Execution Summary — [JIRA-KEY]

  **Completed:** [date/time]
  **Overall Status:** [SUCCESS / PARTIAL / FAILED]

  ### Agents Executed
  | Step | Agent | Status | Notes |
  |------|-------|--------|-------|
  | 1 | salesforce-design-architect | ✅ Completed | Design doc saved to docs/design-documents/[file] |
  | 2 | salesforce-admin | ✅ Completed / ⏭️ Skipped | [summary of admin work or reason skipped] |
  | 3 | salesforce-developer | ✅ Completed / ⏭️ Skipped | [summary of dev work or reason skipped] |
  | 4 | salesforce-code-review | ✅ Approved / ⚠️ Approved with Warnings | [verdict and any warnings] |
  | 5 | salesforce-devops | ✅ Deployed / ❌ Failed | [deployment outcome] |
  | 6 | salesforce-generate-feature-branch | ✅ Completed | Branch: [branch-name] |
  | 7 | create-pr | ✅ Completed | PR: [GitHub PR URL] |

  ### Components Deployed
  [List every component created or modified, with type — e.g. "Lead_Website_FollowUp_Task (Flow — CREATE)"]

  ### GitHub Pull Request
  [PR URL]

  ### Feature Branch
  [branch name]

  If the Jira comment call fails, log the error, inform the user, and do NOT block the final summary.
```

### Code Review Gate Logic

The `salesforce-code-review` agent runs an **internal auto-remediation loop** (Code Analyzer → Developer fix → re-analyze, up to 3 iterations) **before** surfacing a verdict. This is fully autonomous — no user input is needed during the loop.

After the review completes and a final verdict is issued:

```
IF verdict = "APPROVED" or "APPROVED WITH WARNINGS":
    → AUTO-PROCEED to Step 5 (DevOps) — no user confirmation needed

IF verdict = "REJECTED" or "STALLED" (analyzer could not fix after 3 iterations):
    → PAUSE and ask user: "Code review found critical issues that could not be 
      auto-resolved. Do you want to:
        [F] Fix issues (send back to developer with full issue list)
        [S] Skip and deploy anyway (not recommended)
        [C] Cancel deployment"
    
    IF user says "F" or "Fix":
        → Use salesforce-developer subagent to fix: [remaining issue list]
        → After fix, re-run salesforce-code-review (full cycle restarts)
        → If approved, auto-proceed to DevOps
    
    IF user says "S" or "Skip":
        → Auto-proceed to deployment with warning
    
    IF user says "C" or "Cancel":
        → Stop workflow, do not deploy
```

**Internal review loop (runs inside salesforce-code-review — no user input needed):**
```
Iteration 1: run_code_analyzer → violations? → salesforce-developer fixes → re-analyze
Iteration 2: run_code_analyzer → violations? → salesforce-developer fixes → re-analyze  
Iteration 3: run_code_analyzer → violations? → STALLED → surface to user
             run_code_analyzer → clean? → proceed to manual review → verdict
```

---

### Decision Tree for Every Salesforce Request

```
User asks something about Salesforce
            │
            ▼
    Is it a question/discussion only?
            │
       ┌────┴────┐
       │         │
      YES        NO (implementation needed)
       │         │
       ▼         ▼
   Answer it   PRE-STEP 0: Check Atlassian MCP connectivity
   yourself    (call mcp__atlassian__getAccessibleAtlassianResources)
               │
          ┌────┴────┐
          │         │
     Connected   Not Connected
          │         │
          ▼         ▼
          │      STOP — inform user MCP is not connected,
          │      ask which Jira story to work on
          │
          ▼
   MUST DELEGATE — run full pipeline autonomously
               │
               ▼
         Step 1: salesforce-design-architect
                (fetches Jira story via MCP)
               │
               ▼ AUTO-PROCEED
         Step 1b: YOU → Transition Jira to IN PROGRESS
                (getTransitionsForJiraIssue → transitionJiraIssue)
               │
               ▼ AUTO-PROCEED (requirements clear)
         Step 2: Admin (if needed)
               │
               ▼ AUTO-PROCEED
         Step 3: Developer (if needed)
               │
               ▼ AUTO-PROCEED
         Step 4: Code Review
               │
         ┌─────┴─────┐
         │           │
      APPROVED    CHANGES REQUIRED
         │           │
         ▼           ▼
    AUTO-PROCEED   PAUSE → Ask user (Fix/Skip/Cancel)
         │           
         ▼ AUTO-PROCEED
    Step 5: DevOps (deploy)
         │
         ▼ AUTO-PROCEED
    Step 6: Feature Branch
         │
         ▼ AUTO-PROCEED
    Step 7: Pull Request (create-pr skill)
         │
         ▼ AUTO-PROCEED
    Step 7b: YOU → Post pipeline summary comment to Jira
             (mcp__atlassian__addCommentToJiraIssue)
         │
         ▼
    Summarize results to user
```

---

### What Triggers Each Agent

| If user mentions... | Agents Involved |
|---------------------|-----------------|
| Custom Object, Field, Validation Rule | design → admin → devops + docs |
| Apex, Trigger, Class | design → admin → developer → unit-testing → code-review → devops + docs |
| LWC, Lightning Component | design → developer → code-review → devops + docs |
| Mixed (object + trigger) | design → admin → developer → unit-testing → code-review → devops + docs |

---

### Example: Correct Orchestration

**User:** "Create a Feedback object with Rating field and a trigger for notifications"

**You (Main Agent) should run all steps automatically without pausing:**

```
Step 1: Design Analysis (auto-start)
Use the salesforce-design-architect subagent to analyze this request: Create a Feedback object with Rating field and a trigger for notifications

Step 1b: Jira Status Update (YOU do this after Step 1 — not a subagent)
Call mcp__atlassian__getTransitionsForJiraIssue for the story key
Find the "In Progress" transition and call mcp__atlassian__transitionJiraIssue

Step 2: Admin Work (auto-start after Step 1b)
Use the salesforce-admin subagent to: [Design's admin prompt]

Step 3: Developer Work (auto-start after Step 2)
Use the salesforce-developer subagent to: [Design's developer prompt]

Step 4: Code Review (auto-start after Step 3)
Use the salesforce-code-review subagent to review all code created

  → If APPROVED: auto-proceed to Step 5
  → If CHANGES REQUIRED: pause and ask user

Step 5: DevOps (auto-start if review approved)
Use the salesforce-devops subagent to deploy all components

Step 6: Feature Branch (auto-start after Step 5)
Use the salesforce-generate-feature-branch subagent to create a featurebranch

Step 7: Pull Request (auto-start after Step 6)
Invoke the create-pr skill to open a GitHub PR from the feature branch to main.
PR title: "[SCRUM-X] <story summary>"
PR body: story summary, components deployed, link to Jira issue

Step 7b: Post Pipeline Summary to Jira (YOU do this — always last step before final summary)
Call mcp__atlassian__addCommentToJiraIssue on the Jira story with a structured table
showing each agent, its status/result, components deployed, feature branch, and PR URL.
If the call fails, log and continue — do NOT block the final summary.

Summarize all results to the user
```

---

### Skip Rules (Only When User Explicitly Requests)

| User says explicitly... | Action |
|------------------------|--------|
| "skip design" | Skip Design Agent |
| "skip review" | Skip code-review agent |
| "don't deploy" or "no deployment" | Skip devops agent |
| "just analyze" | Only invoke Design Agent |

**If user does NOT explicitly say to skip → ALWAYS follow full workflow**

---

## Transparency & Confirmation Gates

### Only Gate: Code Review
- Location: After Code Review Agent completes
- Verdicts: APPROVED / APPROVED WITH WARNINGS → auto-proceed to DevOps
- CHANGES REQUIRED → pause and ask user: Fix / Skip / Cancel
- All other steps (Design → Admin → Developer → DevOps → Feature Branch → Pull Request) execute automatically without user confirmation

---


## Final Reminder

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   YOU ARE THE ORCHESTRATOR.                                                   ║
║   YOUR JOB IS TO DELEGATE, NOT TO IMPLEMENT.                                  ║
║                                                                               ║
║   WORKFLOW:                                                                   ║
║   Architect → Jira IN PROGRESS → Admin → Developer →                         ║
║   Code Review → DevOps → Feature Branch → Pull Request →                     ║
║   Post Jira Summary Comment                                                   ║
║                                                                               ║
║   When in doubt: DELEGATE TO A SUBAGENT.                                      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```
