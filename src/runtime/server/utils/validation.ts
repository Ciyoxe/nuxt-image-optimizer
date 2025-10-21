import { createError } from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';

const config = useRuntimeConfig().cachedImageOptimizer;

export const validateParams = (params: Record<string, string>) => {
    const settings = {
        format: config.conversion.format as 'webp' | 'avif' | 'jpeg' | 'png',
        quality: config.conversion.quality,
        width: config.conversion.width,
        height: config.conversion.height,
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
        const quality = Number.parseInt(params.q);
        if (Number.isNaN(quality) || quality < 1 || quality > 100) {
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid quality: ${quality}`,
            });
        }
        settings.quality = quality;
    }
    if (params.w) {
        const width = Number.parseInt(params.w);
        if (Number.isNaN(width) || width < 1 || width > 16384) {
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid width: ${width}`,
            });
        }
        settings.width = width;
    }
    if (params.h) {
        const height = Number.parseInt(params.h);
        if (Number.isNaN(height) || height < 1 || height > 16384) {
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
    if (params.url.length > 2048) {
        throw createError({
            statusCode: 400,
            statusMessage: 'URL is too long',
        });
    }
    if (!config.domains.includes(new URL(params.url).hostname)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'URL is not allowed',
        });
    }
    settings.url = params.url;
    return settings;
};
