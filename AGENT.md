# AGENT.md - Single Authoritative Operating Manual

## Overview

This file is the **SINGLE SOURCE OF TRUTH** for all AI agents, developers, and contributors working on Mobius Ledger v2. It defines the mandatory Startup Protocol and operating procedures that must be followed in every session.

**Every session must begin by reading this file and following the Startup Protocol exactly.**

---

## Autonomous Execution Policy

The agent is expected to work autonomously once given a milestone or phase.

After completing one phase, it must automatically continue to the next phase without asking for confirmation unless a Stop Condition occurs.

Do not stop simply to ask:
- "Should I continue?"
- "Would you like me to proceed?"
- "Ready for the next phase?"

Instead, continue automatically.

---

## Standard Workflow

For every phase:
1. Verify repository state.
2. Read CURRENT_MILESTONE.md.
3. Implement the phase.
4. Verify the implementation.
5. Update documentation:
   - CURRENT_MILESTONE.md
   - MODULE_STATUS.md
   - PROJECT_STATUS.md
   - SESSION_HANDOFF.md (when appropriate)
6. Commit.
7. Push immediately to origin/main.
8. Continue automatically to the next phase.

Repeat until the current milestone is fully complete.

---

## Commit Policy

A completed phase must NEVER remain uncommitted.

Every completed phase must have:
- its own commit
- its own push
- documentation updated before committing

Never combine multiple completed phases into one commit unless explicitly instructed.

Push immediately after every successful commit.
Never accumulate multiple local commits.
GitHub should always reflect the latest verified state.

**Commit Message Format:**
- Use imperative mood: "Add", "Update", "Fix" (not "Added", "Updated", "Fixed")
- Use lowercase for first word
- Include milestone and phase context
- Example: `feat: add Income Management backend controllers (Milestone 6 - Phase 3)`

---

## Verification Policy

Before every commit:
- verify imports
- verify exports
- verify routing
- verify architecture consistency
- verify documentation consistency

If tests exist, run them.
If builds exist, verify they succeed.
Never commit known broken code.

---

## Repository Safety Rules

Never:
- force push
- rewrite history
- delete working code without documenting why
- ignore failing verification
- skip documentation updates
- leave completed work uncommitted

---

## Recovery Policy

If interrupted by:
- API limits
- network loss
- timeout
- session termination
- unexpected errors

The agent must:
1. Finish the current logical unit if possible.
2. Update CURRENT_MILESTONE.md.
3. Update SESSION_HANDOFF.md.
4. Commit completed work.
5. Push if possible.
6. Clearly document the blocker.

---

## Stop Conditions

Stop only if:
- documentation contradicts repository state
- merge conflicts occur
- build failures cannot be resolved safely
- failing tests require architectural decisions
- required information is missing
- repository corruption is detected

Otherwise continue autonomously.

---

## Milestone Completion

When a milestone is complete:
1. Perform a final verification.
2. Update all documentation.
3. Commit.
4. Push.
5. Stop and report that the milestone is complete.

Do NOT automatically begin the next milestone unless the current session was explicitly instructed to do so.

---

## Startup Protocol

Every new session (AI or human) must execute this protocol in order, without deviation:

### Step 1: Read Documentation
Read all of these files in order:
1. `AGENT.md` - This file (Start here)
2. `README.md` - Project overview, setup, running
3. `ARCHITECTURE.md` - Architecture, patterns, conventions
4. `CURRENT_MILESTONE.md` - Current development priority (Single Source of Truth for what to work on)
5. `MODULE_STATUS.md` - Complete status of all system modules
6. `PROJECT_STATUS.md` - High-level project status
7. `SESSION_HANDOFF.md` - Previous session details
8. `DEVELOPMENT_ROADMAP.md` - Complete project roadmap

**Never skip any of these files.**

### Step 2: Inspect Repository State
Run these commands:
```bash
cd /data/data/com.termux/files/home/mobius-ledger-v2-
git status
git log --oneline -5
```

### Step 3: Verify Documentation Consistency
Compare the information across all documentation files:
- CURRENT_MILESTONE.md should match MODULE_STATUS.md
- PROJECT_STATUS.md should match the git log
- SESSION_HANDOFF.md should reflect the last completed work

**If any documentation files are inconsistent with each other or with the repository state:**
1. STOP immediately
2. Report the mismatch in detail
3. Do NOT proceed with implementation until documentation is fixed
4. Fix the documentation to match the actual repository state
5. Re-verify consistency

### Step 4: Identify Next Task
The next task is **ALWAYS** defined in `CURRENT_MILESTONE.md` under "Next Task".

**Rule: Work on ONLY the next unfinished phase.**

Do not:
- Jump ahead to future phases
- Work on multiple phases simultaneously
- Re-implement already completed phases
- Work on anything not explicitly listed in the next task

### Step 5: Inspect Current State of Target Files
If the next task involves files that already exist:
1. Read those files completely
2. Understand their current implementation
3. Continue from their current state, not from scratch
4. Do not recreate existing files

Example: If `incomeController.js` already exists, inspect it first and continue from its current state instead of recreating it.

### Step 6: Execute the Work
Implement ONLY what is required for the current phase:
- Follow Clean Architecture rules (ARCHITECTURE.md)
- Follow naming conventions (ARCHITECTURE.md)
- Follow coding standards (ARCHITECTURE.md)
- Keep changes focused and minimal

---

## Phase Completion Protocol

After completing a phase, execute these steps IN ORDER:

### 1. Verify Implementation
- [ ] Syntax check: `node --check <file>` for all new/modified JS files
- [ ] Import checks: Verify all imports/exports are correct
- [ ] Manual inspection: Read all new/modified files
- [ ] Test new functionality manually if possible

### 2. Update Documentation
Update ALL relevant documentation files to reflect the completed work:
- [ ] `CURRENT_MILESTONE.md` - Update current phase, last completed phase
- [ ] `MODULE_STATUS.md` - Update module status, completion %, next planned work
- [ ] `PROJECT_STATUS.md` - Update current milestone, phase, status, latest commit
- [ ] `SESSION_HANDOFF.md` - Document work completed in this session
- [ ] Any other relevant documentation

**Documentation Update Rules:**
- Update documentation **immediately after** completing a phase
- Documentation must be internally consistent
- Cross-references between documents must be correct
- Never leave documentation stale

### 3. Commit and Push
```bash
cd /data/data/com.termux/files/home/mobius-ledger-v2-
git add .
git commit -m "<descriptive message>"
git push origin main
```

---

## Critical Rules (NEVER VIOLATE)

### Documentation Rules
1. ❌ **NEVER** write code without reading AGENT.md first
2. ❌ **NEVER** write code without reading all 8 documentation files
3. ❌ **NEVER** proceed if documentation is inconsistent
4. ❌ **NEVER** leave documentation stale after completing work
5. ❌ **NEVER** skip documentation updates

### Work Rules
6. ❌ **NEVER** work on multiple phases simultaneously
7. ❌ **NEVER** skip ahead to future phases
8. ❌ **NEVER** recreate files that already exist (inspect first, then continue)
9. ❌ **NEVER** leave completed work uncommitted
10. ❌ **NEVER** leave committed work unpushed

### Quality Rules
11. ❌ **NEVER** skip syntax validation
12. ❌ **NEVER** skip import checks
13. ❌ **NEVER** skip testing (backend tests, frontend build)
14. ❌ **NEVER** violate Clean Architecture rules
15. ❌ **NEVER** put business logic in wrong layers (Controllers, Models, Components)

### Financial Integrity Rules (CRITICAL)
16. ❌ **NEVER** perform financial calculations in UI components
17. ❌ **NEVER** store monetary values inconsistently
18. ❌ **NEVER** allow duplicate receipt numbers
19. ❌ **NEVER** silently discard financial data
20. ❌ **NEVER** skip financial validation

See `ARCHITECTURE.md` - Financial Integrity Principles for complete rules.

---

## Milestone Implementation Order

Milestones must be completed in numerical order. Each milestone has 8 phases:

### Backend Phases (1-4)
1. **Phase 1: Models** - Database models with CRUD operations
2. **Phase 2: Services** - Business logic layer
3. **Phase 3: Controllers** - HTTP request handlers
4. **Phase 4: Routes** - API endpoint definitions

### Frontend Phases (5-8)
5. **Phase 5: Services** - API client services
6. **Phase 6: Components** - Reusable UI components
7. **Phase 7: Pages** - Page components
8. **Phase 8: Routing & Navigation** - Route integration, navigation, verification

**Each phase must be completed, committed, and pushed before starting the next phase.**

---

## Repository Governance

### Single Source of Truth
- **GitHub** is the permanent source of truth
- The repository state on GitHub is canonical
- Local sandbox work is temporary
- **Never leave completed work only in the sandbox**

### Branch Strategy
- **Main Branch**: `main` - Always stable, production-ready
- All work is committed directly to `main`
- Push immediately after every commit

### Work Completion Requirements
Every completed feature requires:
1. ✅ Implementation complete
2. ✅ Syntax validation passed
3. ✅ Import checks passed
4. ✅ Testing complete (backend tests pass, frontend build succeeds)
5. ✅ Documentation updated
6. ✅ Commit created with descriptive message
7. ✅ Push to GitHub confirmed

**Never skip any of these steps.**

---

## After Updating AGENT.md

1. Verify that it is consistent with the repository and existing documentation.
2. Update README.md if it should reference AGENT.md.
3. Update SESSION_HANDOFF.md.
4. Commit.
5. Push.

Commit message: Use descriptive format following the Commit Policy above.

---

## Quick Reference

### File Naming Conventions
- **Models**: PascalCase (`Student.js`, `IncomeCategory.js`)
- **Services**: camelCase (`studentService.js`, `incomeCategoryService.js`)
- **Controllers**: PascalCase (`studentController.js`, `incomeCategoryController.js`)
- **Routes**: PascalCase (`studentRoutes.js`, `incomeCategoryRoutes.js`)
- **Components**: PascalCase (`StudentForm.jsx`, `IncomeCard.jsx`)
- **Pages**: PascalCase (`StudentListPage.jsx`, `IncomeDetailPage.jsx`)

### Layer Responsibilities
- **Controllers**: HTTP request/response only
- **Services**: Business logic only
- **Models**: Database operations only
- **Components**: Render UI only
- **Pages**: Compose components and call services only

**Never reverse these dependencies.**

---

## Emergency Protocol

If you encounter any of these situations:

1. **Documentation mismatch**: Stop, report the mismatch, fix documentation first
2. **Broken imports**: Stop, fix imports before proceeding
3. **Test failures**: Stop, fix tests before proceeding
4. **Financial data issues**: Stop immediately, report to maintainer
5. **Unclear next task**: Re-read CURRENT_MILESTONE.md, if still unclear, stop and ask

---

## Session Checklist

Before ending any session:
- [ ] All code changes committed
- [ ] All documentation updated
- [ ] All changes pushed to GitHub
- [ ] `git status` shows clean working tree (or only intentional uncommitted changes)
- [ ] SESSION_HANDOFF.md updated with session details
- [ ] Next task clearly identified in CURRENT_MILESTONE.md

---

## Final Authority

This file (`AGENT.md`) is the ultimate authority for all operating procedures. In case of conflict:

1. AGENT.md (this file) - Highest priority
2. ARCHITECTURE.md - Architecture and implementation rules
3. CURRENT_MILESTONE.md - Current development priority
4. Other documentation files

**If AGENT.md and any other file conflict, AGENT.md wins.**

---

*This file must be read at the start of every session. Never deviate from the Startup Protocol.*
