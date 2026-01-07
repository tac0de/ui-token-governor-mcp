import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GenerateComponentInputSchema, TokenCategory } from "../schemas/index.js";

export const componentTools: Tool[] = [
  {
    name: "generate_component",
    description: `Generate a token-governed UI component for a specific framework.

Output Targets:
- React (TSX) - default
- Vue 3 (SFC)
- Svelte
- Angular
- WebC

RULES:
- Components must map props → tokens
- No visual state without token representation
- Stories are mandatory for every component
- Core logic must be JS-based
- Framework adapters are isolated
- No token depends on a framework concept

The agent will:
1. Read relevant tokens
2. Generate component with token mappings
3. Include Storybook/story file
4. Ensure no hardcoded values`,
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Name of the component (e.g., Button, Card, Modal)",
        },
        framework: {
          type: "string",
          enum: ["react", "vue", "svelte", "angular", "webc"],
          description: "Target framework (default: react)",
        },
        description: {
          type: "string",
          description: "Component description and requirements",
        },
        tokenCategories: {
          type: "array",
          items: {
            type: "string",
            enum: ["color", "spacing", "typography", "elevation", "radius", "breakpoint", "motion"],
          },
          description: "Token categories to use (e.g., ['color', 'spacing', 'typography'])",
        },
      },
      required: ["componentName", "description"],
    },
  },
];

export async function handleGenerateComponent(args: unknown) {
  // Validate input with zod
  const validationResult = GenerateComponentInputSchema.safeParse(args);

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((e) => `- ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid arguments:\n${errors}`);
  }

  const validatedArgs = validationResult.data;

  const framework = validatedArgs.framework;
  const componentName = validatedArgs.componentName;

  // Generate component template
  const component = generateComponentTemplate(
    componentName,
    framework,
    validatedArgs.description,
    validatedArgs.tokenCategories
  );

  const story = generateStoryTemplate(componentName, framework);

  let output = `# ${componentName} Component\n\n`;
  output += `Framework: ${framework}\n`;
  output += `Token Categories: ${validatedArgs.tokenCategories.join(", ")}\n\n`;
  output += `## Component\n\n`;
  output += "```" + getCodeBlockLanguage(framework) + "\n";
  output += component;
  output += "\n```\n\n";
  output += `## Story\n\n`;
  output += "```" + getCodeBlockLanguage(framework) + "\n";
  output += story;
  output += "\n```\n\n";
  output += `## Token Mapping\n\n`;
  output += generateTokenMappingGuide(componentName, validatedArgs.tokenCategories);

  return {
    content: [
      {
        type: "text",
        text: output,
      },
    ],
  };
}

function generateComponentTemplate(
  name: string,
  framework: string,
  description: string,
  tokenCategories: TokenCategory[]
): string {
  const props = generateTokenProps(tokenCategories);

  switch (framework) {
    case "react":
      return `import { tokens } from '@tokens/tokens';

export interface ${name}Props {
  ${props}
  children?: React.ReactNode;
}

export function ${name}(props: ${name}Props) {
  const {
    variant = 'primary',
    size = 'md',
    children,
    ...tokenProps
  } = props;

  // Map props to tokens
  const styles = {
    backgroundColor: tokens.color[variant].base,
    padding: tokens.spacing[size],
    ...tokenProps,
  };

  return (
    <div style={styles}>
      {children}
    </div>
  );
}`;

    case "vue":
      return `<script setup lang="ts">
import { tokens } from '@tokens/tokens';

interface Props {
  ${props}
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
});

// Map props to tokens
const computedStyles = computed(() => ({
  backgroundColor: tokens.color[props.variant].base,
  padding: tokens.spacing[props.size],
}));
</script>

<template>
  <div :style="computedStyles">
    <slot />
  </div>
</template>`;

    case "svelte":
      return `<script lang="ts">
import { tokens } from '@tokens/tokens';

export let variant: 'primary' | 'secondary' = 'primary';
export let size: 'sm' | 'md' | 'lg' = 'md';
${props.split('\n').map((p) => `export let ${p};`).join('\n')}

// Map props to tokens
$: styles = {
  backgroundColor: tokens.color[variant].base,
  padding: tokens.spacing[size],
};
</script>

<div {style}>
  <slot />
</div>`;

    default:
      return `// Component for ${framework}
// TODO: Implement ${name} component with token mappings
`;
  }
}

function generateStoryTemplate(name: string, framework: string): string {
  switch (framework) {
    case "react":
      return `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${name}>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: '${name}',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    children: '${name}',
  },
};

export const Small: Story = {
  args: {
    variant: 'primary',
    size: 'sm',
    children: '${name}',
  },
};

export const Large: Story = {
  args: {
    variant: 'primary',
    size: 'lg',
    children: '${name}',
  },
};`;

    case "vue":
      return `<script setup lang="ts">
import { ${name} } from './${name}.vue';
</script>

<template>
  <Story title="Components/${name}" :layout="{ width: '400px' }">
    <Variant title="Primary">
      <${name} variant="primary" size="md">
        ${name}
      </${name}>
    </Variant>

    <Variant title="Secondary">
      <${name} variant="secondary" size="md">
        ${name}
      </${name}>
    </Variant>

    <Variant title="Small">
      <${name} variant="primary" size="sm">
        ${name}
      </${name}>
    </Variant>

    <Variant title="Large">
      <${name} variant="primary" size="lg">
        ${name}
      </${name}>
    </Variant>
  </Story>
</template>`;

    case "svelte":
      return `import type { Meta, StoryObj } from '@storybook/svelte';
import ${name} from './${name}.svelte';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${name}>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
  },
  render: (args) => ({
    Component: ${name},
    props: args,
  }),
};`;

    default:
      return `// Story for ${framework}
// TODO: Implement stories for ${name}
`;
  }
}

function generateTokenProps(tokenCategories: TokenCategory[]): string {
  const propsMap: Record<string, string[]> = {
    color: ["variant?: 'primary' | 'secondary' | 'accent';"],
    spacing: ["size?: 'sm' | 'md' | 'lg';"],
    typography: ["weight?: 'normal' | 'medium' | 'bold';"],
    elevation: ["elevation?: 'none' | 'sm' | 'md' | 'lg';"],
    radius: ["radius?: 'sm' | 'md' | 'lg' | 'full';"],
    breakpoint: ["breakpoint?: 'sm' | 'md' | 'lg' | 'xl';"],
    motion: ["animation?: 'fadeIn' | 'slideIn' | 'scaleIn';"],
  };

  const props: string[] = [];
  tokenCategories.forEach((category) => {
    if (propsMap[category]) {
      props.push(...propsMap[category]);
    }
  });

  return props.join("\n  ");
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

function generateTokenMappingGuide(
  componentName: string,
  tokenCategories: TokenCategory[]
): string {
  let guide = `Token mappings for ${componentName}:\n\n`;

  const mappings = [
    {
      category: "Color",
      tokens: ["color.primary.base", "color.secondary.base", "color.text.base"],
      props: ["variant"],
    },
    {
      category: "Spacing",
      tokens: ["spacing.sm", "spacing.md", "spacing.lg"],
      props: ["size", "padding"],
    },
    {
      category: "Typography",
      tokens: ["typography.size.base", "typography.weight.medium"],
      props: ["weight", "textSize"],
    },
    {
      category: "Elevation",
      tokens: ["elevation.sm", "elevation.md", "elevation.lg"],
      props: ["elevation"],
    },
    {
      category: "Radius",
      tokens: ["radius.sm", "radius.md", "radius.lg", "radius.full"],
      props: ["radius"],
    },
  ];

  mappings.forEach(({ category, tokens, props }) => {
    if (tokenCategories.includes(category.toLowerCase() as TokenCategory)) {
      guide += `### ${category}\n`;
      guide += `- Tokens: \`${tokens.join("`, `")}\`\n`;
      guide += `- Props: \`${props.join("`, `")}\`\n\n`;
    }
  });

  guide += `### Mapping Rules\n\n`;
  guide += `- ⭕ token.space.md (framework-agnostic)\n`;
  guide += `- ❌ token.padding.react (framework-specific)\n`;
  guide += `- All visual values MUST come from tokens\n`;
  guide += `- No hardcoded colors, spacing, or fonts\n`;

  return guide;
}
