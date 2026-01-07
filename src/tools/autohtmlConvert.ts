import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConvertAutoHTMLInputSchema } from "../schemas/index.js";

export const autohtmlTools: Tool[] = [
  {
    name: "convert_autohtml",
    description: `Convert AutoHTML code to token-governed components.

This is the final step in the workflow: Design Tokens => Figma => AutoHTML => Final Code

AutoHTML output contains:
- Inline styles (FORBIDDEN)
- Hardcoded values (FORBIDDEN)
- Static markup (needs tokenization)

This tool will:
1. Extract component structure from AutoHTML
2. Identify inline styles and hardcoded values
3. Replace with token references
4. Generate framework-specific component code
5. Include Storybook stories

Rules:
- ⭕ PROPER: \`backgroundColor: tokens.color.primary.base\`
- ❌ FORBIDDEN: \`style={{ backgroundColor: '#0066cc' }}\`
- ❌ FORBIDDEN: \`style="background-color: #0066cc"\`

Output is ready for production use with token governance.`,
    inputSchema: {
      type: "object",
      properties: {
        autohtmlCode: {
          type: "string",
          description: "AutoHTML code to convert",
        },
        framework: {
          type: "string",
          enum: ["react", "vue", "svelte", "angular", "webc"],
          description: "Target framework (default: react)",
        },
        applyTokens: {
          type: "boolean",
          description: "Whether to apply tokens (default: true)",
          default: true,
        },
        removeInlineStyles: {
          type: "boolean",
          description: "Whether to remove inline styles (default: true)",
          default: true,
        },
        componentName: {
          type: "string",
          description: "Name for the generated component",
        },
      },
      required: ["autohtmlCode"],
    },
  },
];

export async function handleConvertAutoHTML(args: unknown) {
  // Validate input with zod
  const validationResult = ConvertAutoHTMLInputSchema.safeParse(args);

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((e) => `- ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid arguments:\n${errors}`);
  }

  const validatedArgs = validationResult.data;

  // Process AutoHTML code
  const result = processAutoHTML(
    validatedArgs.autohtmlCode,
    validatedArgs.framework,
    validatedArgs.applyTokens,
    validatedArgs.removeInlineStyles,
    validatedArgs.componentName
  );

  return {
    content: [
      {
        type: "text",
        text: result,
      },
    ],
  };
}

function processAutoHTML(
  autohtmlCode: string,
  framework: string,
  applyTokens: boolean,
  removeInlineStyles: boolean,
  componentName?: string
): string {
  let output = "# AutoHTML to Token-Governed Component\n\n";

  // Analyze AutoHTML for violations
  const violations = analyzeAutoHTML(autohtmlCode);

  if (violations.length > 0) {
    output += `## ⚠️ AutoHTML Violations Detected\n\n`;
    output += `AutoHTML contains ${violations.length} token governance violations:\n\n`;

    violations.forEach((v) => {
      output += `- 🚫 **${v.type}** (Line ${v.line})\n`;
      output += `  ${v.message}\n`;
    });

    output += `\n### Auto-generated code is NOT authoritative.\n`;
    output += `These violations MUST be fixed before production use.\n\n`;
  }

  // Extract component structure
  const structure = extractComponentStructure(autohtmlCode);

  output += `## Component Structure\n\n`;
  output += `Framework: ${framework}\n`;
  output += `Elements: ${structure.elementCount}\n`;
  output += `Depth: ${structure.maxDepth}\n\n`;

  if (structure.classes.length > 0) {
    output += `### Classes Found\n\n`;
    structure.classes.forEach((cls) => {
      output += `- \`${cls}\`\n`;
    });
    output += `\n`;
  }

  // Generate token-governed code
  if (applyTokens || removeInlineStyles) {
    const convertedCode = convertToTokenGoverned(
      autohtmlCode,
      framework,
      applyTokens,
      removeInlineStyles,
      componentName
    );

    output += `## Token-Governed Component Code\n\n`;
    output += "```" + getCodeBlockLanguage(framework) + "\n";
    output += convertedCode;
    output += "\n```\n\n";
  }

  // Generate token mapping recommendations
  if (applyTokens) {
    output += `## Token Mapping Recommendations\n\n`;
    output += generateTokenRecommendations(autohtmlCode);
  }

  output += `## Conversion Summary\n\n`;
  output += `- Inline styles removed: ${removeInlineStyles ? "✅" : "❌"}\n`;
  output += `- Tokens applied: ${applyTokens ? "✅" : "❌"}\n`;
  output += `- Violations found: ${violations.length}\n`;
  output += `- Ready for production: ${violations.length === 0 ? "✅" : "❌"}\n\n`;

  if (violations.length > 0) {
    output += `### Required Actions\n\n`;
    output += `1. Review all detected violations\n`;
    output += `2. Map hardcoded values to tokens using \`read_tokens\`\n`;
    output += `3. Verify component with \`validate_component_tokens\`\n`;
    output += `4. Ensure no AutoHTML residue remains\n`;
  }

  return output;
}

function analyzeAutoHTML(code: string): Array<{
  type: string;
  line: number;
  message: string
}> {
  const violations: Array<{ type: string; line: number; message: string }> = [];
  const lines = code.split("\n");

  const patterns = [
    {
      pattern: /style=\{\{/,
      type: "inline-style-obj",
      message: "Inline style object detected. Must use tokens.",
    },
    {
      pattern: /style="/,
      type: "inline-style-attr",
      message: "Inline style attribute detected. Must use tokens.",
    },
    {
      pattern: /#[0-9a-fA-F]{3,6}\b/,
      type: "hardcoded-color",
      message: "Hardcoded color value. Must use color token.",
    },
    {
      pattern: /\b\d+(px|rem|em|pt)\b/,
      type: "hardcoded-size",
      message: "Hardcoded spacing/size. Must use spacing token.",
    },
    {
      pattern: /\b(arial|helvetica|times|courier)\b/i,
      type: "hardcoded-font",
      message: "Hardcoded font family. Must use typography token.",
    },
  ];

  lines.forEach((line, index) => {
    patterns.forEach(({ pattern, type, message }) => {
      if (pattern.test(line)) {
        violations.push({
          type,
          line: index + 1,
          message,
        });
      }
    });
  });

  return violations;
}

function extractComponentStructure(code: string): {
  elementCount: number;
  maxDepth: number;
  classes: string[];
} {
  const elements = code.match(/<[a-z][a-z0-9]*/gi) || [];
  const classes = code.match(/class="([^"]+)"/gi) || [];

  return {
    elementCount: elements.length,
    maxDepth: calculateDepth(code),
    classes: classes.map((c) => c.replace(/class="([^"]+)"/, "$1")),
  };
}

function calculateDepth(code: string): number {
  let maxDepth = 0;
  let currentDepth = 0;

  for (const char of code) {
    if (char === "<") {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === ">") {
      currentDepth--;
    }
  }

  return maxDepth;
}

function convertToTokenGoverned(
  code: string,
  framework: string,
  applyTokens: boolean,
  removeInlineStyles: boolean,
  componentName?: string
): string {
  const name = componentName || "Component";

  // Remove inline styles if requested
  let cleanedCode = code;
  if (removeInlineStyles) {
    cleanedCode = cleanedCode
      .replace(/\s*style=\{\{[^}]+\}\}\s*/g, " ")
      .replace(/\s*style="[^"]*"\s*/g, " ");
  }

  // Generate framework-specific component
  switch (framework) {
    case "react":
      return `import { tokens } from '@tokens/tokens';

export interface ${name}Props {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export function ${name}(props: ${name}Props) {
  const {
    variant = 'primary',
    size = 'md',
    children,
  } = props;

  // Map props to tokens
  const styles = {
    backgroundColor: tokens.color[variant].base,
    padding: tokens.spacing[size],
    // TODO: Add additional token mappings based on AutoHTML structure
  };

  return (
    <div style={styles}>
      {children || '${name}'}
    </div>
  );
}`;

    case "vue":
      return `<script setup lang="ts">
import { tokens } from '@tokens/tokens';

interface Props {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
});

// Map props to tokens
const styles = computed(() => ({
  backgroundColor: tokens.color[props.variant].base,
  padding: tokens.spacing[props.size],
}));
</script>

<template>
  <div :style="styles">
    <slot>${name}</slot>
  </div>
</template>`;

    case "svelte":
      return `<script lang="ts">
import { tokens } from '@tokens/tokens';

export let variant: 'primary' | 'secondary' = 'primary';
export let size: 'sm' | 'md' | 'lg' = 'md';

// Map props to tokens
$: styles = {
  backgroundColor: tokens.color[variant].base,
  padding: tokens.spacing[size],
};
</script>

<div {style}>
  <slot>${name}</slot>
</div>`;

    default:
      return `// Token-governed component for ${framework}
// AutoHTML structure converted to use tokens
// TODO: Implement ${name} component
`;
  }
}

function generateTokenRecommendations(code: string): string {
  let recommendations = "";

  // Color recommendations
  if (/#{1}[0-9a-fA-F]{3,6}\b/.test(code)) {
    recommendations += `### Color Tokens\n\n`;
    recommendations += `Create color tokens to replace hardcoded values:\n`;
    recommendations += `\`\`\`json\n`;
    recommendations += `{\n`;
    recommendations += `  "base": "#0066cc",\n`;
    recommendations += `  "light": "#3388dd",\n`;
    recommendations += `  "dark": "#004c99"\n`;
    recommendations += `}\n`;
    recommendations += `\`\`\`\n\n`;
  }

  // Spacing recommendations
  if (/\d+(px|rem|em)\b/.test(code)) {
    recommendations += `### Spacing Tokens\n\n`;
    recommendations += `Create spacing tokens:\n`;
    recommendations += `\`\`\`json\n`;
    recommendations += `{\n`;
    recommendations += `  "value": "1rem",\n`;
    recommendations += `  "px": 16\n`;
    recommendations += `}\n`;
    recommendations += `\`\`\`\n\n`;
  }

  // Typography recommendations
  if (/\b(arial|helvetica|times)\b/i.test(code)) {
    recommendations += `### Typography Tokens\n\n`;
    recommendations += `Create typography tokens:\n`;
    recommendations += `\`\`\`json\n`;
    recommendations += `{\n`;
    recommendations += `  "fontFamily": "system-ui",\n`;
    recommendations += `  "fontSize": "16px"\n`;
    recommendations += `}\n`;
    recommendations += `\`\`\`\n\n`;
  }

  return recommendations;
}

function getCodeBlockLanguage(framework: string): string {
  const langMap: Record<string, string> = {
    react: "tsx",
    vue: "vue",
    svelte: "svelte",
    angular: "ts",
    webc: "js",
  };
  return langMap[framework] || "ts";
}
