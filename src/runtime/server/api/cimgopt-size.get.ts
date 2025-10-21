import { createError, defineEventHandler, getQuery, setHeaders } from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';
import { Service } from '../service/service';
import { getTimeInMilliseconds } from '../../shared/configs';
import { validateParams } from '../utils/validation';

const config = useRuntimeConfig().cachedImageOptimizer;

export default defineEventHandler(async (event) => {
    const service = event.context.service;

    if (!service || !(service instanceof Service)) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Cache service not found',
        });
    }

    const settings = validateParams(getQuery(event));
    const size = await service.getImageSize(settings.url);

    setHeaders(event, {
        'Cache-Control': `public, max-age=${Math.round(getTimeInMilliseconds(config.autoRefresh.maxAge) / 1000)}`,
    });
    return size;
});
