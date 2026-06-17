# Copilot Documentation Architecture Implementation Guide

## Purpose

This document explains how to implement a structured documentation system that enables GitHub Copilot (or similar AI coding assistants) to work safely and consistently within a repository.

It describes:

* what the documentation system is
* why it exists
* how it works
* how to implement it in another repository

The exact documentation content will vary per repository, but the **architecture and implementation pattern remain the same**.

---

# Goals of This System

This system is designed to:

* help AI understand repository architecture
* guide AI through tasks safely
* reduce hallucinated patterns
* prevent unsafe refactors
* enforce consistent workflows
* preserve architectural intent
* minimize unnecessary context loading
* keep documentation aligned with the codebase

The system assumes that work begins from a **GitHub Issue**.

---

# Core Idea

Instead of using flat documentation, the repository uses a **layered documentation system**.

Each layer has a specific role.

```text
.github/copilot-instructions.md
        ↓
docs/TASK-CLASSIFICATION.md
        ↓
docs/SKILLS.md
        ↓
docs/skills/*.md
        ↓
docs/GUARDRAILS.md
docs/ARCHITECTURE.md
docs/DECISIONS.md
docs/STYLES.md
docs/WORKFLOW.md
```

This allows AI to:

1. start with the issue
2. classify the task
3. load only the relevant procedural instructions
4. consult architecture and rules only when necessary

This dramatically reduces context overload.

---

# Repository Workflow

The intended workflow for AI-driven development is:

```text
User's task
    ↓
copilot-instructions.md
    ↓
TASK-CLASSIFICATION.md
    ↓
Relevant SKILLS
    ↓
ARCHITECTURE / STYLES / DECISIONS
    ↓
GUARDRAILS
    ↓
Validation
    ↓
Pull Request
    ↓
Documentation review
```

The documentation structure enforces this workflow.

---

# Documentation Layers

Each layer serves a different purpose.

---

# 1. Copilot Entry Point

File:

```
.github/copilot-instructions.md
```

This is the **AI bootloader**.

It must remain short and high-signal.

It instructs Copilot to:

* read the User's task first
* classify the task
* load the appropriate skills
* follow repository guardrails
* respect architecture
* run validation
* prepare a Pull Request
* update documentation when necessary

This file should **not contain detailed procedures**.

It should link to deeper documentation instead.

---

# 2. Task Classification

File:

```
docs/TASK-CLASSIFICATION.md
```

This document helps AI determine **what kind of task it is solving**.

Examples of task categories:

* UI change
* form change
* routing change
* data fetching
* data model change
* shared library change
* architecture change
* repository tooling change
* site or service creation

Each category should reference relevant skills.

---

# 3. Skills System

Skills are **procedural instructions** for completing tasks safely.

Two files define the skill system.

```
docs/SKILLS.md
docs/skills/*.md
```

---

## Skill Index

File:

```
docs/SKILLS.md
```

This file lists all available skills and when to use them.

Example:

```text
Skill: UI Change
Description: Modify user interface elements safely
Reference: docs/skills/SKILL-UI-CHANGE.md
```

The index should remain concise.

---

## Skill Documents

Location:

```
docs/skills/
```

Each skill file explains **how to perform a specific type of change**.

Example:

```
SKILL-UI-CHANGE.md
SKILL-FORM-CHANGE.md
SKILL-ROUTING-CHANGE.md
SKILL-DATA-FETCHING.md
SKILL-REPOSITORY-VALIDATION.md
```

Each skill should include:

* purpose
* when to use it
* when not to use it
* procedure
* validation requirements
* related documentation

Skills represent **repeatable development capabilities**.

---

# 4. Guardrails

File:

```
docs/GUARDRAILS.md
```

Guardrails define **hard safety rules**.

Examples:

* implement the smallest safe change
* avoid unrelated refactors
* do not introduce architectural changes without explicit instruction
* respect module boundaries
* prefer existing patterns

Guardrails prevent AI from making large or unsafe changes.

---

# 5. Architecture Documentation

File:

```
docs/ARCHITECTURE.md
```

This document explains the repository structure.

Typical contents include:

* module boundaries
* shared vs application code
* routing structure
* data flow patterns
* service boundaries
* build or runtime architecture

This helps AI place code in the correct location.

---

# 6. Design Decisions

File:

```
docs/DECISIONS.md
```

This file explains **intentional design choices**.

Examples:

* framework choices
* UI libraries
* state management strategy
* logging conventions
* dependency policies

This prevents AI from “fixing” patterns that are intentional.

---

# 7. Style Conventions

File:

```
docs/STYLES.md
```

This document describes coding and design conventions.

Examples:

* naming conventions
* component patterns
* styling systems
* localization patterns
* accessibility expectations

AI should follow these conventions when writing new code.

---

# 8. Workflow

File:

```
docs/WORKFLOW.md
```

This describes the lifecycle of a task.

Typical steps:

1. read issue
2. classify task
3. load relevant skills
4. implement minimal change
5. run validation
6. prepare pull request
7. review documentation impact

---

# 9. Pull Request Guidelines

File:

```
docs/workflow/WORKFLOW-PRS.md
```

This document explains:

* branch naming
* commit message format
* PR expectations
* validation evidence
* documentation checks

---

# Implementation Pattern

This system should be introduced in phases.

---

# Phase 1 — Inventory the Repository

Identify:

* existing documentation
* repository structure
* build and validation commands
* architecture boundaries
* common task types
* tooling workflows

---

# Phase 2 — Design the Documentation Layers

Create the documentation structure:

```
.github/copilot-instructions.md
docs/TASK-CLASSIFICATION.md
docs/SKILLS.md
docs/skills/
docs/GUARDRAILS.md
docs/ARCHITECTURE.md
docs/DECISIONS.md
docs/STYLES.md
docs/WORKFLOW.md
docs/workflow/
```

Do not rewrite existing docs yet.

---

# Phase 3 — Draft the Skills

Skills should be written first because they drive AI behavior.

Start with:

* smallest safe change
* pattern lookup
* repository validation
* linting
* testing
* build
* pull request preparation

Then add repository-specific skills.

---

# Phase 4 — Draft Guardrails and Architecture

Next define:

* guardrails
* architecture
* design decisions
* styles
* workflow

These documents provide the constraints around skills.

---

# Phase 5 — Draft the Entry Point

Finally write:

```
.github/copilot-instructions.md
```

This file should:

* route to the documentation system
* explain the expected workflow
* enforce validation
* emphasize minimal changes

---

# Phase 6 — Migration Audit

If the repository already had documentation, compare:

* original docs
* new structured docs

Identify:

* preserved rules
* replaced rules
* missing guidance
* contradictions

Update the structured docs accordingly.

---

# Phase 7 — Repository Alignment Audit

Compare the documentation with the actual codebase.

This ensures the documentation reflects reality.

Identify:

* undocumented patterns
* incorrect assumptions
* tooling workflows
* architecture boundaries
* validation commands

Update the documentation as needed.

---

# Phase 8 — Promote the New Documentation

Once aligned:

* replace the old documentation
* commit the new structure
* archive or remove outdated docs

---

# Living Documentation

These documents must be treated as **living documentation**.

After completing tasks, evaluate whether:

* new patterns were introduced
* workflows changed
* architecture evolved
* new skills are required

If so, update the documentation accordingly.

---

# What Must Be Customized Per Repository

Each repository must determine its own:

* architecture boundaries
* validation commands
* task categories
* tooling workflows
* shared component rules
* data layer conventions
* localization workflow
* state management patterns
* example locations

The **documentation architecture transfers** between repositories.

The **content must be adapted**.

---

# Benefits of This Approach

When implemented correctly, this system provides:

* deterministic AI task execution
* reduced hallucinations
* safer automated code changes
* architecture-aware development
* easier onboarding for new developers
* documentation that evolves with the codebase
* improved traceability of repository behavior

---

# Summary

This documentation system transforms a repository from:

```text
code + scattered docs
```

into:

```text
code + structured AI development environment
```

By separating:

* workflow
* guardrails
* architecture
* skills

the repository becomes significantly easier for both **humans and AI** to understand and modify safely.