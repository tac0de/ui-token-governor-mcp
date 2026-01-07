# UI Token Governor MCP

A Model Context Protocol (MCP) server for governing token-based UI systems and generating framework-agnostic components. Optimized for the **Design Tokens → Figma → AutoHTML → Production Code** workflow.

## Features

- **Token Reading**: Read and validate UI tokens from your design system
- **Figma Export Processing**: Extract tokens from Figma design exports
- **AutoHTML Conversion**: Transform AutoHTML to token-governed components
- **Component Validation**: Ensure components follow token-governed rules
- **Component Generation**: Generate token-compliant components for multiple frameworks
- **Multi-Framework Support**: React, Vue, Svelte, Angular, and WebC
- **Zod Validation**: Type-safe input validation using Zod schemas

## Installation

```bash
npm install ui-token-governor-mcp
```

## Building

```bash
npm install
npm run build
```

## Configuration

Add to your Claude Desktop MCP config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ui-token-governor": {
      "command": "node",
      "args": ["/path/to/ui-token-governor-mcp/dist/index.js"]
    }
  }
}
```

## Workflow: Design Tokens → Figma → AutoHTML → Code

This MCP server follows the workflow:

```
Design Tokens → Figma Export → AutoHTML → Token-Governed Code
     ↓              ↓               ↓              ↓
  JSON files   Figma JSON    AutoHTML     Production
                                HTML         Components
```

### Step 1: Design Tokens
Define your design tokens in JSON format (see [Token System Structure](#token-system-structure))

### Step 2: Figma Export
Export your designs from Figma as JSON

### Step 3: Process Figma Export
Use `process_figma_export` to extract tokens and detect components

### Step 4: AutoHTML Conversion
Use `convert_autohtml` to transform AutoHTML to token-governed code

### Step 5: Validation
Use `validate_component_tokens` to ensure token compliance

## Available Tools

### 1. `read_tokens`

Read UI tokens from your token system.

**Parameters:**
- `tokenPath` (optional): Path to token file (e.g., `tokens/color/primary.json`)
- `category` (optional): Token category filter (`color`, `spacing`, `typography`, `elevation`, `radius`, `breakpoint`, `motion`)

**Example:**
```
Read tokens from the spacing category
```

### 2. `validate_component_tokens`

Validate that components follow token-governed rules.

**Parameters:**
- `componentCode`: The component code to validate
- `framework`: Target framework (`react`, `vue`, `svelte`, `angular`, `webc`)

**Forbidden Patterns:**
- Inline styles (`style={{...}}` or `style="..."`)
- Hardcoded colors (`#fff`, `rgb(...)`)
- Hardcoded spacing (`px`, `rem`, `em`)
- Hardcoded fonts (`Arial`, `Helvetica`)
- Framework-specific token references

**Example:**
```
Validate this React component for token compliance:
[component code]
```

### 3. `generate_component`

Generate a token-governed UI component.

**Parameters:**
- `componentName`: Name of the component (required)
- `description`: Component description and requirements (required)
- `framework`: Target framework (default: `react`)
- `tokenCategories`: Token categories to use (default: `["color", "spacing", "typography"]`)

**Output:**
- Component code with token mappings
- Storybook story
- Token mapping guide

**Example:**
```
Generate a Button component for React with primary and secondary variants, using color, spacing, and typography tokens
```

### 4. `process_figma_export`

Process Figma design exports and extract design tokens.

**Parameters:**
- `figmaFilePath`: Path to Figma export JSON file (required)
- `extractTokens`: Whether to extract tokens (default: `true`)
- `generateComponents`: Whether to generate component stubs (default: `false`)
- `outputDir`: Output directory for generated tokens (default: `./tokens`)

**Features:**
- Extract design tokens from Figma JSON exports
- Parse Figma styles, colors, spacing, typography
- Generate framework-agnostic token files
- Validate token structure against schema

**Example:**
```
Process the Figma export at figma/design-system.json and extract all tokens
```

### 5. `convert_autohtml`

Convert AutoHTML code to token-governed components.

**Parameters:**
- `autohtmlCode`: AutoHTML code to convert (required)
- `framework`: Target framework (default: `react`)
- `applyTokens`: Whether to apply tokens (default: `true`)
- `removeInlineStyles`: Whether to remove inline styles (default: `true`)
- `componentName`: Name for the generated component (optional)

**What it does:**
1. Extract component structure from AutoHTML
2. Identify inline styles and hardcoded values
3. Replace with token references
4. Generate framework-specific component code
5. Include Storybook stories

**Example:**
```
Convert this AutoHTML to a React component with tokens:
[AutoHTML code]
```

## Token System Structure

```
tokens/
├── color/
│   ├── primary.json
│   ├── secondary.json
│   └── index.json
├── spacing/
│   ├── sm.json
│   ├── md.json
│   └── index.json
├── typography/
│   ├── size.json
│   └── weight.json
└── schema.json
```

## Agent Directive

This server follows the UI System Agent Directive (see [AGENTS.md](./AGENTS.md)):

### Core Principles

1. **Canonical Truth**: UI tokens are the single source of truth
2. **Framework Agnostic**: No token depends on framework concepts
3. **Token Compliance**: All UI values must come from tokens
4. **No Hardcoded Values**: Violations result in hard rejection
5. **AutoHTML is Not Authoritative**: Auto-generated code must be converted to token-governed code

### Multi-Framework Rules

- Core logic must be JS-based
- Framework adapters are isolated
- Tokens like `token.space.md` are valid
- Tokens like `token.padding.react` are forbidden

### Review Checklist

- [ ] All visual values come from tokens
- [ ] Component is reusable
- [ ] No AutoHTML residue
- [ ] Framework adapter respected

### Branch Policy

- `scaffold/autohtml` outputs → prototype branches only
- `main` branch accepts token-governed system code only

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch for changes
npm run watch

# Run the server
node dist/index.js
```

## License

ISC
