# Documentation

Structured AI development docs for Satellite Server. Start at [`.github/copilot-instructions.md`](../.github/copilot-instructions.md).

## Layer map

```text
.github/copilot-instructions.md     AI entry point (read first)
docs/COPILOT-OPERATING-RULES.md    Repo operating rules
docs/TASK-CLASSIFICATION.md        What kind of task is this?
docs/SKILLS.md                       Skill index
docs/skills/*.md                     How to do specific work
docs/GUARDRAILS.md                   Hard safety rules
docs/ARCHITECTURE.md                 Repo structure and data flow
docs/DECISIONS.md                    Intentional design choices
docs/STYLES.md                       Coding conventions
docs/WORKFLOW.md                     Task lifecycle
docs/workflow/WORKFLOW-PRS.md        Pull request guidelines
```

## Human setup

For install, Docker, API endpoints, and OMM examples see the root [`README.md`](../README.md).

## Domain skills

| Skill | Use for |
|-------|---------|
| [Satellite propagation basics](./skills/SKILL-SATELLITE-PROPAGATION-BASICS.md) | TLE, OMM, SGP4, coordinate frames |
| [Cesium viewer change](./skills/SKILL-CESIUM-VIEWER-CHANGE.md) | Globe, camera, entities |

## Maintenance

This is **living documentation**. After tasks that change patterns or workflows, update the relevant files (see [`WORKFLOW.md`](./WORKFLOW.md) step 8).
