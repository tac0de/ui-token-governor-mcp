import { Tool } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { ReadTokensInputSchema } from "../schemas/index.js";

export const readTokenTools: Tool[] = [
  {
    name: "read_tokens",
    description: `Read UI tokens from the token system. Tokens are the single source of truth for all UI values.

Accepted inputs:
- /tokens/*/_*.json
- /tokens/schema.json
- /scaffold/*.json

Returns token values for use in component generation. All UI values MUST come from tokens.`,
    inputSchema: {
      type: "object",
      properties: {
        tokenPath: {
          type: "string",
          description: "Path to the token file (e.g., tokens/color/primary.json, tokens/spacing/md.json)",
        },
        category: {
          type: "string",
          enum: ["color", "spacing", "typography", "elevation", "radius", "breakpoint", "motion"],
          description: "Token category to filter",
        },
      },
    },
  },
];

export async function handleReadTokens(args: unknown) {
  // Validate input with zod
  const validationResult = ReadTokensInputSchema.safeParse(args);

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((e) => `- ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid arguments:\n${errors}`);
  }

  const validatedArgs = validationResult.data;

  try {
    let tokenPath = validatedArgs.tokenPath;

    if (!tokenPath && validatedArgs.category) {
      // Default to tokens/{category}/index.json if no specific path
      tokenPath = `tokens/${validatedArgs.category}/index.json`;
    }

    if (!tokenPath) {
      // List all token files if no specific request
      const tokensDir = "tokens";
      if (!fs.existsSync(tokensDir)) {
        return {
          content: [
            {
              type: "text",
              text: "No tokens directory found. Please ensure /tokens/ exists with token definitions.",
            },
          ],
        };
      }

      const tokenFiles: string[] = [];
      const scanDirectory = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDirectory(fullPath);
          } else if (entry.name.endsWith(".json")) {
            tokenFiles.push(fullPath);
          }
        }
      };

      scanDirectory(tokensDir);

      return {
        content: [
          {
            type: "text",
            text: `Available token files:\n${tokenFiles.map((f) => `  - ${f}`).join("\n")}`,
          },
        ],
      };
    }

    // Read specific token file
    if (!fs.existsSync(tokenPath)) {
      return {
        content: [
          {
            type: "text",
            text: `Token file not found: ${tokenPath}`,
          },
        ],
      };
    }

    const tokenContent = fs.readFileSync(tokenPath, "utf-8");
    const tokenData = JSON.parse(tokenContent);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(tokenData, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(
      `Failed to read tokens: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
