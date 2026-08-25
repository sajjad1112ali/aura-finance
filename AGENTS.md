# CRITICAL RULES - MUST FOLLOW

## RESPONSES

- Keep responses concise and to the point - unless the user asks otherwise
- When reporting information to me, be **extremely concise** and sacrifice grammar for the sake of concision.

## PLANNING MODE

- Always ask clarifying questions
- Never assume design, tech stack or features
- Use deep-dive sub-agents to assist with research
- Use deep-dive sub-agents to review the different aspects of your plan before presenting to the user

## PACKAGE MANAGEMENT

- NEVER install, uninstall, upgrade, downgrade, or replace any package or dependency without my explicit permission.
- NEVER modify `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, or any other dependency lock file unless I explicitly ask.
- If a new package is required, STOP and explain:
  - Why it is needed.
  - Which package you recommend.
  - Any alternatives that avoid adding a dependency.
- Prefer using existing project dependencies.
- Do not assume permission to add or update packages, even if it seems necessary to complete the task.
- If a dependency issue blocks progress, ask for my approval before making any package-related changes.

## CHANGE / EDIT MODE

- Never implement features yourself when possible - use sub-agents!
- Identify changes from the plan that can be implemented in parallel, and use sub-agents to implement the features efficiently
- When using sub-agents to implement features, act as a coordinator only
- Use the best model for the task - premium models for complex tasks (like coding) and mid-tier models for simpler tasks, like documentation
- After completing features (large or small), always run commands like lint, type check to check code quality

## DATABASE SCHEMA CHANGES

- Whenever you make changes to the database schema, ALWAYS run the drizzle generate and migrate commands
- NEVER run drizzle push!

## TESTING

- Use any testing tools, libraries available to the project for testing your changes
- Never assume your changes simply work, always test!
- If the project does not have any testing tools, scripts, MCP tools, skills, etc. available for testing, ask the user whether testing should be skipped.

## FRONTEND / UI DEVELOPMENT

- Before building any UI, ALWAYS check whether a suitable shadcn/ui component already exists in the project.
- Search the existing `components/ui` directory first. Do NOT recreate components that already exist.
- Prefer composing interfaces from existing shadcn/ui components (Button, Input, Select, Dialog, Sheet, Dropdown Menu, Popover, Table, Card, Badge, Tabs, Form, etc.) instead of writing custom implementations.
- If a required shadcn/ui component is not present, STOP and ask for approval before installing it or modifying project dependencies.
- Never create a custom component when an equivalent shadcn/ui component exists.
- Extend or wrap existing shadcn/ui components only when project-specific behavior is required, while preserving the original API whenever possible.
- Follow the project's existing design system, variants, spacing, typography, accessibility, and responsive patterns.
- Reuse existing shared components before creating new feature-specific components.
- Avoid duplicate UI patterns. If the same UI appears in multiple places, extract it into a shared reusable component.
