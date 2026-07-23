import { promises as fs } from 'fs';
import path from 'path';

/**
 * Manages a file-based registry of prompts.
 * Prompts are stored in a directory structure and can be loaded with typed,
 * validated parameters.
 */
export class PromptRegistry {
  private readonly registry = new Map<string, string>();
  private readonly promptDir: string;

  constructor(dir: string) {
    this.promptDir = dir;
  }

  /**
   * Load all prompts from the configured directory.
   */
  async loadAll(): Promise<void> {
    const entries = await fs.readdir(this.promptDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.prompt.txt')) {
        const key = entry.name.replace('.prompt.txt', '');
        const content = await fs.readFile(path.join(this.promptDir, entry.name), 'utf-8');
        this.registry.set(key, content);
      }
    }
  }

  /**
   * Get a prompt by key and substitute placeholders.
   * Placeholders are in the format {{variable}}.
   */
  get<T extends Record<string, string | number>>(
    key: string,
    params: T,
  ): string {
    let template = this.registry.get(key);
    if (!template) {
      throw new Error(`Prompt with key "${key}" not found.`);
    }

    for (const [param, value] of Object.entries(params)) {
      const regex = new RegExp(`{{${param}}}`, 'g');
      template = template.replace(regex, String(value));
    }

    if (template.includes('{{')) {
      throw new Error(`Not all placeholders were replaced in prompt "${key}".`);
    }

    return template;
  }
}
