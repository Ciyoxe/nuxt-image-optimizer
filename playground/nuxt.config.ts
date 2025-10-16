export default defineNuxtConfig({
    compatibilityDate: '2025-10-08',
    devtools: { enabled: true },
    modules: ['../src/module'],

    cachedImageOptimizer: {
        cache: {
            maxSize: '300KB',
            queueSize: 1000,
            queueTimeout: '0s',
            storagePath: '.cache/oimgs',
        }
    },
});
