import { defineNuxtModule, createResolver, addComponent, addServerPlugin, addServerHandler } from '@nuxt/kit';
import { type ModuleConfig, defaultModuleConfig } from './options';

export default defineNuxtModule<ModuleConfig>({
    defaults: defaultModuleConfig,
    meta: {
        name: 'cached-image-optimizer',
        configKey: 'cachedImageOptimizer',
    },
    setup(config, nuxt) {
        const resolver = createResolver(import.meta.url);

        const storageOptions = {
            'cached-image-optimizer__local': {
                driver: 'fs',
                base: 'public',
            },
            'cached-image-optimizer__cache': {
                driver: config.cache.storagePath === 'in-memory' ? 'memory' : 'fs',
                base: config.cache.storagePath === 'in-memory' ? null : config.cache.storagePath,
            },
        };

        // transform domains to not contain urls
        config.domains = config.domains.map((url) => new URL(url).hostname);

        nuxt.options.runtimeConfig.public.cachedImageOptimizerSizes = config.sizes;
        nuxt.options.runtimeConfig.public.cachedImageOptimizerDomains = config.domains;
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

        addServerPlugin(resolver.resolve('./runtime/server/plugins/service'));
        addServerHandler({
            handler: resolver.resolve('./runtime/server/api/cimgopt.get'),
            route: '/api/__cimgopt',
        });
        addServerHandler({
            handler: resolver.resolve('./runtime/server/api/cimgopt-size.get'),
            route: '/api/__cimgopt-size',
        });
        addServerHandler({
            handler: resolver.resolve('./runtime/server/api/cimgopt-debug.get'),
            route: '/api/__cimgopt-debug',
        });
        addComponent({
            filePath: resolver.resolve('./runtime/components/o-img/index.vue'),
            name: 'o-img',
        });
    },
});
