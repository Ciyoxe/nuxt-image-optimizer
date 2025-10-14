import { createError, defineEventHandler, getQuery, setHeaders } from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';
import { Service } from '../service/service';
import { getTimeInMilliseconds } from '../../shared/configs';

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
    const image = await service.getImage(settings.url, settings);

    setHeaders(event, {
        'Cache-Control': `public, max-age=${Math.round(getTimeInMilliseconds(config.autoRefresh.maxAge) / 1000)}`,
    });
    return image;
});

const validateParams = (params: Record<string, string>) => {
    const settings = {
        format: config.format.format as 'webp' | 'avif' | 'jpeg' | 'png',
        quality: config.format.quality,
        width: config.format.width,
        height: config.format.height,
        url: '',
    };
    switch (params.f) {
        case 'webp':
            settings.format = 'webp';
            break;
        case 'avif':
            settings.format = 'avif';
            break;
        case 'jpeg':
            settings.format = 'jpeg';
            break;
        case 'png':
            settings.format = 'png';
            break;
        case undefined:
            break;
        default:
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid format: ${params.f}`,
            });
    }
    if (params.q) {
        const quality = parseInt(params.q);
        if (isNaN(quality) || quality < 1 || quality > 100) {
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid quality: ${quality}`,
            });
        }
        settings.quality = quality;
    }
    if (params.w) {
        const width = parseInt(params.w);
        if (isNaN(width) || width < 1 || width > 16384) {
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid width: ${width}`,
            });
        }
        settings.width = width;
    }
    if (params.h) {
        const height = parseInt(params.h);
        if (isNaN(height) || height < 1 || height > 16384) {
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid height: ${height}`,
            });
        }
        settings.height = height;
    }
    if (!params.url) {
        throw createError({
            statusCode: 400,
            statusMessage: 'URL is required',
        });
    }
    settings.url = params.url;
    return settings;
};
