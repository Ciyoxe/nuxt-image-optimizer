import { defineNuxtModule, createResolver, addComponent, addServerPlugin } from '@nuxt/kit';
import { type ModuleConfig, defaultModuleConfig } from './options';

export default defineNuxtModule<ModuleConfig>({
    defaults: defaultModuleConfig,
    meta: {
        name: 'cached-image-optimizer',
        configKey: 'cachedImageOptimizer',
    },
    setup(config, nuxt) {
        const storageOptions = {
            'cached-image-optimizer__local': {
                driver: 'fs',
                base: 'public'
            },
            'cached-image-optimizer__cache': {
                driver: config.cache.storagePath === 'in-memory' ? 'memory' : 'fs',
                base: config.cache.storagePath === 'in-memory' ? null : '.cache',
            },
        };

        nuxt.options.runtimeConfig.cachedImageOptimizer = config;
        nuxt.options.nitro ||= {};
        nuxt.options.nitro.storage = {
            ...nuxt.options.nitro.storage,
            ...storageOptions,
        };
        nuxt.options.nitro.devStorage = {
            ...nuxt.options.nitro.devStorage,
            ...storageOptions,
        };

        const resolver = createResolver(import.meta.url);
        addComponent({
            name: 'o-img',
            filePath: resolver.resolve('./runtime/components/o-img'),
        });
        addServerPlugin(resolver.resolve('./runtime/server/plugins/service'));
    },
});
