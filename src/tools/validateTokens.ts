import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ValidateTokensInputSchema } from "../schemas/index.js";

interface Violation {
  type: string;
  line?: number;
  severity: "error" | "warning";
  message: string;
}

export const validationTools: Tool[] = [
  {
    name: "validate_component_tokens",
    description: `Validate that a component follows token-governed rules.

FORBIDDEN PATTERNS:
- Inline styles (style={{...}})
- Hardcoded spacing, colors, fonts
- Framework-specific assumptions in tokens

Review checklist:
- All visual values come from tokens
- Component is reusable
- No hardcoded values
- Framework adapter respected

Returns violations found in the code.`,
    inputSchema: {
      type: "object",
      properties: {
        componentCode: {
          type: "string",
          description: "The component code to validate",
        },
        framework: {
          type: "string",
          enum: ["react", "vue", "svelte", "angular", "webc"],
          description: "Target framework",
        },
      },
      required: ["componentCode", "framework"],
    },
  },
];

export async function handleValidateTokens(args: unknown) {
  // Validate input with zod
  const validationResult = ValidateTokensInputSchema.safeParse(args);

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((e) => `- ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid arguments:\n${errors}`);
  }

  const validatedArgs = validationResult.data;

  const violations: Violation[] = [];
  const lines = validatedArgs.componentCode.split("\n");

  // Forbidden pattern detection
  const forbiddenPatterns = [
    {
      pattern: /style=\{\{/,
      type: "inline-style",
      message: "Inline styles detected. All styles must come from tokens.",
      severity: "error" as const,
    },
    {
      pattern: /style="/,
      type: "inline-style-attr",
      message: "Inline style attribute detected. Use token classes or props.",
      severity: "error" as const,
    },
    {
      pattern: /#[0-9a-fA-F]{3,6}\b/,
      type: "hardcoded-color",
      message: "Hardcoded color detected. Use color tokens instead.",
      severity: "error" as const,
    },
    {
      pattern: /\b(px|rem|em|pt|vh|vw)\b/,
      type: "hardcoded-spacing",
      message: "Hardcoded spacing/size detected. Use spacing tokens instead.",
      severity: "warning" as const,
    },
    {
      pattern: /\b(arial|helvetica|times|courier|georgia|verdana)\b/i,
      type: "hardcoded-font",
      message: "Hardcoded font detected. Use typography tokens instead.",
      severity: "error" as const,
    },
    {
      pattern: /className=.*\s+/,
      type: "potential-hardcoded",
      message: "Check that all class names map to token values.",
      severity: "warning" as const,
    },
  ];

  lines.forEach((line, index) => {
    forbiddenPatterns.forEach(({ pattern, type, message, severity }) => {
      if (pattern.test(line)) {
        violations.push({
          type,
          line: index + 1,
          severity,
          message,
        });
      }
    });
  });

  // Framework-specific checks
  if (validatedArgs.framework === "react") {
    const reactPattern = /token\.padding\.react/;
    if (reactPattern.test(validatedArgs.componentCode)) {
      violations.push({
        type: "framework-specific-token",
        severity: "error",
        message:
          "Framework-specific token detected. Tokens must remain framework-agnostic. Use token.space.md instead of token.padding.react",
      });
    }
  }

  // Generate report
  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warningCount = violations.filter((v) => v.severity === "warning").length;

  let report = `## Token Compliance Validation Report\n\n`;
  report += `Framework: ${validatedArgs.framework}\n`;
  report += `Errors: ${errorCount} | Warnings: ${warningCount}\n\n`;

  if (violations.length === 0) {
    report += `✅ Component passes token validation!\n\n`;
    report += `Review Checklist:\n`;
    report += `- [x] All visual values come from tokens\n`;
    report += `- [x] No hardcoded values detected\n`;
    report += `- [x] No inline styles found\n`;
    report += `- [x] Framework adapter respected\n`;
  } else {
    report += `❌ Component violates token governance rules\n\n`;
    report += `## Violations:\n\n`;

    violations.forEach((v) => {
      const icon = v.severity === "error" ? "🚫" : "⚠️";
      report += `${icon} **Line ${v.line}** [${v.type}]\n`;
      report += `   ${v.message}\n\n`;
    });

    report += `## Required Actions:\n\n`;
    report += `1. Replace all hardcoded values with token references\n`;
    report += `2. Remove inline styles\n`;
    report += `3. Map all visual properties to tokens\n`;
    report += `4. Ensure component is reusable across contexts\n`;
  }

  return {
    content: [
      {
        type: "text",
        text: report,
      },
    ],
  };
}
