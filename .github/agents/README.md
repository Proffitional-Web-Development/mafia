# GitHub Custom Agents

This folder contains reusable custom-agent definitions based on `agents/AGENTS.md`.

## Files

- `A1-backend-architect.md`
- `A2-frontend-ui-engineer.md`
- `A3-i18n-rtl-specialist.md`
- `A4-auth-identity-engineer.md`
- `A5-game-logic-designer.md`
- `A6-qa-security-agent.md`
- `A7-devops-infra-agent.md`
- `A8-reviewer-agent.md`

## How to use in GitHub Copilot

1. Open the agent file you want.
2. Copy the **Prompt Template** section.
3. Create a custom agent in GitHub Copilot and paste the template.
4. Name the custom agent with the same A-number for consistent routing.

## Routing rule

- Use the primary owner from `TASK-MATRIX.md` as the default custom agent.
- Include co-agent review only when listed in the matrix.
