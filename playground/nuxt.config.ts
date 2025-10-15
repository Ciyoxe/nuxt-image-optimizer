export default defineNuxtConfig({
    compatibilityDate: '2025-10-08',
    devtools: { enabled: true },
    modules: ['../src/module'],

    cachedImageOptimizer: {
        cache: {
            maxSize: '20MB',
            queueSize: 1000,
            queueTimeout: '5s',
            storagePath: '.cache/oimgs',
        }
    },
});
