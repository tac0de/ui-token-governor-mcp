#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { readTokenTools } from "./tools/readTokens.js";
import { validationTools } from "./tools/validateTokens.js";
import { componentTools } from "./tools/generateComponent.js";
import { figmaExportTools } from "./tools/figmaExport.js";
import { autohtmlTools } from "./tools/autohtmlConvert.js";

class UITokenGovernorServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "ui-token-governor-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        ...readTokenTools,
        ...validationTools,
        ...componentTools,
        ...figmaExportTools,
        ...autohtmlTools,
      ];
      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "read_tokens":
            return await (await import("./tools/readTokens.js")).handleReadTokens(args);

          case "validate_component_tokens":
            return await (await import("./tools/validateTokens.js")).handleValidateTokens(args);

          case "generate_component":
            return await (await import("./tools/generateComponent.js")).handleGenerateComponent(args);

          case "process_figma_export":
            return await (await import("./tools/figmaExport.js")).handleProcessFigmaExport(args);

          case "convert_autohtml":
            return await (await import("./tools/autohtmlConvert.js")).handleConvertAutoHTML(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("UI Token Governor MCP server running on stdio");
  }
}

const server = new UITokenGovernorServer();
server.run().catch(console.error);
