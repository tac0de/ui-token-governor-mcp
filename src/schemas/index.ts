import { z } from "zod";

// Token-related schemas
export const TokenCategorySchema = z.enum([
  "color",
  "spacing",
  "typography",
  "elevation",
  "radius",
  "breakpoint",
  "motion",
]);

export const FrameworkSchema = z.enum([
  "react",
  "vue",
  "svelte",
  "angular",
  "webc",
]);

// Tool input schemas
export const ReadTokensInputSchema = z.object({
  tokenPath: z.string().optional(),
  category: TokenCategorySchema.optional(),
});

export const ValidateTokensInputSchema = z.object({
  componentCode: z.string().min(1, "Component code is required"),
  framework: FrameworkSchema,
});

export const GenerateComponentInputSchema = z.object({
  componentName: z.string().min(1, "Component name is required"),
  description: z.string().min(1, "Description is required"),
  framework: FrameworkSchema.default("react"),
  tokenCategories: z.array(TokenCategorySchema).default([
    "color",
    "spacing",
    "typography",
  ]),
});

export const ProcessFigmaExportInputSchema = z.object({
  figmaFilePath: z.string().min(1, "Figma export file path is required"),
  extractTokens: z.boolean().default(true),
  generateComponents: z.boolean().default(false),
});

export const ConvertAutoHTMLInputSchema = z.object({
  autohtmlCode: z.string().min(1, "AutoHTML code is required"),
  framework: FrameworkSchema.default("react"),
  applyTokens: z.boolean().default(true),
  removeInlineStyles: z.boolean().default(true),
  componentName: z.string().optional(),
});

// Token value schemas
export const ColorTokenSchema = z.object({
  base: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  light: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
  lighter: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
  dark: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
  contrast: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
});

export const SpacingTokenSchema = z.object({
  value: z.string(),
  px: z.number().optional(),
});

export const TypographyTokenSchema = z.object({
  value: z.string(),
});

// Type exports
export type TokenCategory = z.infer<typeof TokenCategorySchema>;
export type Framework = z.infer<typeof FrameworkSchema>;
export type ColorToken = z.infer<typeof ColorTokenSchema>;
export type SpacingToken = z.infer<typeof SpacingTokenSchema>;
export type TypographyToken = z.infer<typeof TypographyTokenSchema>;
