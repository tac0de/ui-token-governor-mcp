# @tac0de/ui-token-governor-mcp

MCP server for UI token governance. **Design Tokens → Figma → AutoHTML → Production Code**

## Installation & Configuration

### via npx (Recommended)

```json
{
  "mcpServers": {
    "ui-token-governor": {
      "command": "npx",
      "args": ["@tac0de/ui-token-governor-mcp"]
    }
  }
}
```

### via npm install

```bash
npm install @tac0de/ui-token-governor-mcp
```

```json
{
  "mcpServers": {
    "ui-token-governor": {
      "command": "node",
      "args": ["/path/to/node_modules/@tac0de/ui-token-governor-mcp/dist/index.js"]
    }
  }
}
```

## Tools

### `read_tokens`

Read UI tokens from the token system.

```typescript
{
  tokenPath?: string;        // e.g., "tokens/color/primary.json"
  category?: "color" | "spacing" | "typography" | "elevation" | "radius" | "breakpoint" | "motion";
}
```

---

### `validate_component_tokens`

Validate components follow token-governed rules.

```typescript
{
  componentCode: string;     // Component code to validate
  framework: "react" | "vue" | "svelte" | "angular" | "webc";
}
```

**Detects:**
- Inline styles (`style={{...}}`, `style="..."`)
- Hardcoded colors (`#fff`)
- Hardcoded spacing (`px`, `rem`, `em`)
- Hardcoded fonts (`Arial`)
- Framework-specific tokens

---

### `generate_component`

Generate token-governed component with Storybook stories.

```typescript
{
  componentName: string;     // Required
  description: string;       // Required
  framework?: "react" | "vue" | "svelte" | "angular" | "webc";  // Default: "react"
  tokenCategories?: ("color" | "spacing" | "typography" | "elevation" | "radius" | "breakpoint" | "motion")[];  // Default: ["color", "spacing", "typography"]
}
```

**Returns:** Component code + Storybook story + Token mapping guide

---

### `process_figma_export`

Extract design tokens from Figma JSON exports.

```typescript
{
  figmaFilePath: string;     // Required - Path to Figma export JSON
  extractTokens?: boolean;   // Default: true
  generateComponents?: boolean;  // Default: false
  outputDir?: string;        // Default: "./tokens"
}
```

**Extracts:** Colors, spacing, typography, components

---

### `convert_autohtml`

Transform AutoHTML to token-governed components.

```typescript
{
  autohtmlCode: string;      // Required - AutoHTML code
  framework?: "react" | "vue" | "svelte" | "angular" | "webc";  // Default: "react"
  applyTokens?: boolean;     // Default: true
  removeInlineStyles?: boolean;  // Default: true
  componentName?: string;    // Optional
}
```

**Does:**
1. Remove inline styles
2. Replace hardcoded values with tokens
3. Generate framework-specific code
4. Create Storybook stories

---

## Workflow

```
Design Tokens → Figma Export → AutoHTML → Token-Governed Code
     ↓              ↓               ↓              ↓
  JSON files   Figma JSON    AutoHTML     Production
                                HTML         Components
```

## Token Structure

```
tokens/
├── color/
│   ├── primary.json
│   └── secondary.json
├── spacing/
│   └── md.json
└── schema.json
```

## Core Rules

- ⭕ `token.space.md` (framework-agnostic)
- ❌ `token.padding.react` (framework-specific)
- ✅ All visual values from tokens
- ❌ No hardcoded values
- ❌ AutoHTML is NOT authoritative

## License

MIT
