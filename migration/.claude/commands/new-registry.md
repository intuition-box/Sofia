Create the registry for #$ARGUMENTS

# Registry Creation Guide

This guide covers the complete process for creating a new component registry entry in the Now.ts UI project.

## Overview

Creating a new registry component involves 4 main steps:

1. Add the component to the main @registry.json
2. Add documentation in `app/_docs/`
3. Create examples if needed
4. Build the registry with `pnpm registry:build` (auto-generates public files)

## Step 1: Main Registry Entry

Add your component to @registry.json following this structure:

```json
{
  "name": "component-name",
  "type": "registry:block",
  "title": "Component Title",
  "description": "Brief description of what the component does.",
  "registryDependencies": ["button", "input", "sonner"],
  "dependencies": ["motion", "react-use-measure"],
  "docs": "Important setup instructions (optional)",
  "files": [
    {
      "path": "registry/nowts/blocks/component-name/component.tsx",
      "type": "registry:component"
    },
    {
      "path": "registry/nowts/blocks/component-name/hooks/use-hook.ts",
      "type": "registry:hook"
    },
    {
      "path": "registry/nowts/blocks/component-name/lib.ts",
      "type": "registry:lib",
      "target": "/lib/component-name/lib.ts"
    }
  ]
}
```

### File Types

- `registry:component` - React components
- `registry:hook` - Custom hooks
- `registry:lib` - Library/utility files (use `target` for custom placement)

### Dependencies

- `registryDependencies` - shadcn/ui components (from @components.json)
- `dependencies` - npm packages

You should add all dependencies. You can refer internal dependencies using `https://ui.nowts.app/r/<internal-deps>.json` that you can find inside the public/r folder.

## Step 2: Documentation

Create `app/_docs/component-name.mdx` following the structure of @app/\_docs/server-toast.mdx ! Always READ this file before creating the docs to follow the same conventions and right usage of MDX components.

### Required frontmatter:

```yaml
---
title: "Component Title"
description: "Description for SEO and component list"
slug: "component-name"
externalDocs: "https://link-to-external-docs" # optional
type: "hook"
---
```

### Documentation structure:

1. **Introduction** - Brief description with external links if applicable
2. **Tabs component** with Preview and Code tabs
3. **About section** - Detailed description and features list
4. **Installation section** - CommandBlock with the install command
5. **Usage section** - Multiple code examples

### Key components to use:

- `<Tabs>` and `<TabsContent>` for preview/code switching
- `<ComponentView>` for component previews
- `<CodeBlock>` for code examples with syntax highlighting
- `<CommandBlock>` for installation commands
- `<CopyCode>` for quick copy functionality

## Step 3: Examples (Optional)

If your component needs interactive examples, create `app/ui/_components/examples/component-name-examples.tsx`.

Reference @server-toast-examples.tsx for structure:

```tsx
import { Button } from "@/components/ui/button";
import { componentFunction } from "@/registry/nowts/blocks/component-name/component";

export function ComponentExamples() {
  return <div className="space-y-4">{/* Interactive examples here */}</div>;
}
```

**Important**: Export the main example component and import it in your MDX documentation.

Add in @MDXComponents.tsx afterward.

The examples SHOULD BE SIMPLE, UI MINIMALIST, USE SHADCN/UI COMPONENT WITHOUT ANYTHING USELESS. Please keep things simple.

## Step 5: Build Registry

After completing all steps, run:

```bash
pnpm registry:build
```

This executes `shadcn build` which:

- Validates the registry structure
- Auto-generates public registry files in `public/r/`
- Updates all component files with proper content
- Validates TypeScript compilation and dependencies

## Component Patterns

### Server Components

For server-side functionality (like @server-toast):

- Use `"use server"` directive
- Handle cookies/headers appropriately
- Include both server and client components

### Client Components

For interactive components:

- Use `"use client"` directive
- Include proper state management
- Handle loading/error states

### Hooks

Follow the pattern in @use-countdown.ts:

- Export custom hooks with proper TypeScript
- Include cleanup in useEffect
- Return stable object references

## Registry File Validation

The registry build process validates:

- JSON schema compliance
- File path existence
- TypeScript compilation
- Dependency resolution

Common issues:

- Missing dependencies in `registryDependencies`
- Incorrect file paths in @registry.json
- Missing required frontmatter in MDX

## Best Practices

1. **Naming**: Use kebab-case for all file and component names
2. **Types**: Always include comprehensive TypeScript definitions
3. **Documentation**: Include both basic and advanced examples
4. **Dependencies**: Minimize external dependencies
5. **Testing**: Ensure examples work before publishing
6. **Accessibility**: Follow a11y best practices
7. **Performance**: Use React best practices (memo, callback, etc.)

## Docs

- https://ui.shadcn.com/docs/registry/registry-json
- https://ui.shadcn.com/docs/registry/registry-item-json
- @mdx.ts
- @docs.ts