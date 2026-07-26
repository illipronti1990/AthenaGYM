/** Marketplace Plugin SDK — Sprint 9 */

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  description?: string;
  publisher?: string;
  category?: string;
  menu?: string;
  permissions: string[];
  hooks?: string[];
  routes?: string[];
};

export type PluginContext = {
  companyId: string;
  installationId: string;
  config: Record<string, unknown>;
};

export type PluginHooks = {
  onInstall?: (ctx: PluginContext) => Promise<void> | void;
  onConfigure?: (ctx: PluginContext, config: Record<string, unknown>) => Promise<void> | void;
  onUninstall?: (ctx: PluginContext) => Promise<void> | void;
  onEvent?: (ctx: PluginContext, eventType: string, payload: Record<string, unknown>) => Promise<void> | void;
};

export type AthenaPlugin = {
  manifest: PluginManifest;
  hooks: PluginHooks;
};

export function definePlugin(plugin: AthenaPlugin): AthenaPlugin {
  if (!plugin.manifest.id || !plugin.manifest.name || !plugin.manifest.version) {
    throw new Error('Plugin manifest requires id, name and version');
  }
  if (!Array.isArray(plugin.manifest.permissions)) {
    throw new Error('Plugin manifest.permissions must be an array');
  }
  return plugin;
}

export function validateManifest(raw: unknown): PluginManifest {
  const m = raw as PluginManifest;
  if (!m?.id || !m?.name || !m?.version) {
    throw new Error('Invalid plugin.json / manifest.json');
  }
  return {
    id: String(m.id),
    name: String(m.name),
    version: String(m.version),
    description: m.description ? String(m.description) : undefined,
    publisher: m.publisher ? String(m.publisher) : undefined,
    category: m.category ? String(m.category) : 'general',
    menu: m.menu ? String(m.menu) : undefined,
    permissions: Array.isArray(m.permissions) ? m.permissions.map(String) : [],
    hooks: Array.isArray(m.hooks) ? m.hooks.map(String) : [],
    routes: Array.isArray(m.routes) ? m.routes.map(String) : [],
  };
}

/** Example nutrition plugin scaffold */
export const nutritionPluginExample = definePlugin({
  manifest: {
    id: 'nutrition',
    name: 'Nutrição',
    version: '1.0.0',
    description: 'Planos alimentares integrados ao aluno',
    publisher: 'ATHENA Labs',
    category: 'health',
    menu: 'Nutrição',
    permissions: ['students.read', 'workouts.read'],
    hooks: ['onInstall', 'onEvent'],
    routes: ['/plugins/nutrition'],
  },
  hooks: {
    onInstall: async (ctx) => {
      // Creates menu + tables + API exposure (handled by marketplace service)
      void ctx;
    },
    onEvent: async (_ctx, eventType) => {
      if (eventType === 'student.created') {
        // Integrate with student profile
      }
    },
  },
});
