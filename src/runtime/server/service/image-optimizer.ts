import sharp from 'sharp';
import type { AvifOptions, JpegOptions, PngOptions, WebpOptions } from 'sharp';
import type { ImageData } from './image-fetcher';

export type ImageSettings = {
    format: 'webp' | 'avif' | 'jpeg' | 'png';
    width: number;
    height: number;
    quality: number;
};

export class ImageOptimizer {
    async optimizeImage(image: ImageData, settings: ImageSettings) {
        let { width, height, data } = image;

        const scale = Math.min(settings.width / width, settings.height / height);
        if (scale < 1) {
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }

        const additionalOptions = {} as PngOptions & JpegOptions & WebpOptions & AvifOptions;
        switch (settings.format) {
            case 'png':
                additionalOptions.progressive = true;
                break;
            case 'jpeg':
                additionalOptions.progressive = true;
                break;
            case 'webp':
                additionalOptions.effort = 6;
                break;
            case 'avif':
                additionalOptions.chromaSubsampling = settings.quality > 75 ? '4:4:4' : '4:2:0';
                break;
        }

        return {
            width,
            height,
            data: await sharp(data)
                .resize(width, height, {
                    fit: 'inside',
                    kernel: 'lanczos3',
                    withoutEnlargement: true,
                })
                .toFormat(settings.format, {
                    quality: settings.quality,
                    alphaQuality: settings.quality,

                    ...additionalOptions,
                })
                .toBuffer(),
        };
    }
}
