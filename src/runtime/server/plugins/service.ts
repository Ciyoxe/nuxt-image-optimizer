import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime';
import { getSizeInBytes, getTimeInMilliseconds } from '../../shared/configs';
import { Service } from '../service/service';

export default defineNitroPlugin(async (nitro) => {
    const config = useRuntimeConfig().cachedImageOptimizer;
    if (!config) {
        throw new Error('Cached image optimizer is not configured');
    }

    const service = new Service({
        autoRefreshInterval: getTimeInMilliseconds(config.autoRefresh.maxAge),

        backgroundQueueSize: config.autoRefresh.queueSize,
        backgroundQueueTimeout: getTimeInMilliseconds(config.autoRefresh.queueTimeout),

        mainQueueSize: config.cache.queueSize,
        mainQueueTimeout: getTimeInMilliseconds(config.cache.queueTimeout),

        maxCacheSize: getSizeInBytes(config.cache.maxSize),

        cpuEffort: config.format.cpuEffort,
    });

    await service.init();

    nitro.hooks.hook('request', (event) => {
        event.context.service = service;
    });
    nitro.hooks.hookOnce('close', () => service.destroy());
});
