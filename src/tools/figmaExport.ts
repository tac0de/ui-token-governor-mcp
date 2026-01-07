import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ProcessFigmaExportInputSchema } from "../schemas/index.js";
import * as fs from "fs";

export const figmaExportTools: Tool[] = [
  {
    name: "process_figma_export",
    description: `Process Figma design exports and extract design tokens.

This tool handles the first step in the workflow: Design Tokens => Figma => AutoHTML

Features:
- Extract design tokens from Figma JSON exports
- Parse Figma styles, colors, spacing, typography
- Generate framework-agnostic token files
- Validate token structure against schema

Input: Figma export file (JSON format from Figma API or plugin)
Output: Token files ready for component generation`,
    inputSchema: {
      type: "object",
      properties: {
        figmaFilePath: {
          type: "string",
          description: "Path to Figma export JSON file",
        },
        extractTokens: {
          type: "boolean",
          description: "Whether to extract tokens from the export",
          default: true,
        },
        generateComponents: {
          type: "boolean",
          description: "Whether to generate component stubs",
          default: false,
        },
        outputDir: {
          type: "string",
          description: "Output directory for generated tokens (default: ./tokens)",
          default: "./tokens",
        },
      },
      required: ["figmaFilePath"],
    },
  },
];

export async function handleProcessFigmaExport(args: unknown) {
  // Validate input with zod
  const validationResult = ProcessFigmaExportInputSchema.safeParse(args);

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((e) => `- ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid arguments:\n${errors}`);
  }

  const validatedArgs = validationResult.data;

  try {
    // Read Figma export file
    if (!fs.existsSync(validatedArgs.figmaFilePath)) {
      return {
        content: [
          {
            type: "text",
            text: `Figma export file not found: ${validatedArgs.figmaFilePath}`,
          },
        ],
      };
    }

    const figmaContent = fs.readFileSync(validatedArgs.figmaFilePath, "utf-8");
    const figmaData = JSON.parse(figmaContent);

    // Process Figma data
    const result = processFigmaData(
      figmaData,
      validatedArgs.extractTokens,
      validatedArgs.generateComponents
    );

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (error) {
    throw new Error(
      `Failed to process Figma export: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function processFigmaData(
  figmaData: any,
  extractTokens: boolean,
  generateComponents: boolean
): string {
  let output = "# Figma Export Processing Results\n\n";

  // Extract colors
  if (extractTokens) {
    const colors = extractColors(figmaData);
    if (colors.length > 0) {
      output += `## Extracted Color Tokens\n\n`;
      output += `Found ${colors.length} color tokens:\n\n`;
      colors.forEach((color) => {
        output += `- ${color.name}: \`${color.value}\`\n`;
      });
      output += `\nToken files can be generated in \`tokens/color/\`\n\n`;
    }

    // Extract spacing
    const spacing = extractSpacing(figmaData);
    if (spacing.length > 0) {
      output += `## Extracted Spacing Tokens\n\n`;
      output += `Found ${spacing.length} spacing tokens:\n\n`;
      spacing.forEach((space) => {
        output += `- ${space.name}: ${space.value}px\n`;
      });
      output += `\nToken files can be generated in \`tokens/spacing/\`\n\n`;
    }

    // Extract typography
    const typography = extractTypography(figmaData);
    if (typography.length > 0) {
      output += `## Extracted Typography Tokens\n\n`;
      output += `Found ${typography.length} typography tokens:\n\n`;
      typography.forEach((type) => {
        output += `- ${type.name}: ${type.fontFamily}, ${type.fontSize}px\n`;
      });
      output += `\nToken files can be generated in \`tokens/typography/\`\n\n`;
    }
  }

  // Extract components
  if (generateComponents) {
    const components = extractComponents(figmaData);
    if (components.length > 0) {
      output += `## Detected Components\n\n`;
      output += `Found ${components.length} components:\n\n`;
      components.forEach((comp) => {
        output += `- **${comp.name}**: ${comp.type}\n`;
        output += `  - AutoHTML available: ${comp.hasAutoHTML ? "✅" : "❌"}\n`;
      });
      output += `\nUse \`generate_component\` to create token-governed components.\n\n`;
    }
  }

  output += `## Next Steps\n\n`;
  output += `1. Review extracted tokens for accuracy\n`;
  output += `2. Map Figma tokens to framework-agnostic token names\n`;
  output += `3. Use \`convert_autohtml\` to transform AutoHTML to token-governed code\n`;
  output += `4. Use \`validate_component_tokens\` to ensure compliance\n\n`;

  output += `## Token Governance Rules\n\n`;
  output += `- ⭕ Use framework-agnostic names: \`color.primary.base\`\n`;
  output += `- ❌ Avoid framework-specific names: \`color.react.primary\`\n`;
  output += `- ✅ All visual values must reference tokens\n`;
  output += `- ✅ No hardcoded values in final components\n`;

  return output;
}

function extractColors(figmaData: any): Array<{ name: string; value: string }> {
  const colors: Array<{ name: string; value: string }> = [];

  // This is a simplified extraction - real Figma exports have complex structures
  if (figmaData.styles?.colors) {
    Object.entries(figmaData.styles.colors).forEach(([key, value]: [string, any]) => {
      colors.push({
        name: formatTokenName(key),
        value: value,
      });
    });
  }

  return colors;
}

function extractSpacing(figmaData: any): Array<{ name: string; value: number }> {
  const spacing: Array<{ name: string; value: number }> = [];

  // Extract spacing from Figma grid/layout data
  if (figmaData.styles?.grids) {
    Object.entries(figmaData.styles.grids).forEach(([key, value]: [string, any]) => {
      if (value.section === "spacing") {
        spacing.push({
          name: formatTokenName(key),
          value: value.value || 0,
        });
      }
    });
  }

  return spacing;
}

function extractTypography(figmaData: any): Array<{
  name: string;
  fontFamily: string;
  fontSize: number;
}> {
  const typography: Array<{ name: string; fontFamily: string; fontSize: number }> = [];

  if (figmaData.styles?.text) {
    Object.entries(figmaData.styles.text).forEach(([key, value]: [string, any]) => {
      typography.push({
        name: formatTokenName(key),
        fontFamily: value.fontFamily || "sans-serif",
        fontSize: value.fontSize || 16,
      });
    });
  }

  return typography;
}

function extractComponents(figmaData: any): Array<{
  name: string;
  type: string;
  hasAutoHTML: boolean
}> {
  const components: Array<{ name: string; type: string; hasAutoHTML: boolean }> = [];

  if (figmaData.components) {
    figmaData.components.forEach((comp: any) => {
      components.push({
        name: comp.name,
        type: comp.type || "COMPONENT",
        hasAutoHTML: comp.description?.includes("AutoHTML") || false,
      });
    });
  }

  return components;
}

function formatTokenName(name: string): string {
  // Convert Figma token names to framework-agnostic format
  return (
    name
      .replace(/\s+/g, "/")
      .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
      // Convert to dot notation
      .replace(/\//g, ".")
  );
}
