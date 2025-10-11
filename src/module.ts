import { defineNuxtModule, createResolver, addComponent } from '@nuxt/kit';
import { type ModuleConfig, defaultModuleConfig } from './options';

export default defineNuxtModule<ModuleConfig>({
    defaults: defaultModuleConfig,
    meta: {
        name: 'cached-image-optimizer',
        configKey: 'cachedImageOptimizer',
    },
    setup() {
        const resolver = createResolver(import.meta.url);
        addComponent({
            name: 'o-img',
            filePath: resolver.resolve('./runtime/components/o-img'),
        });
    },
});
