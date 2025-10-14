<template>
    <img :srcset :sizes v-bind="$attrs" />
</template>

<script setup lang="ts">
import { useRuntimeConfig } from '#app';
import { computed } from 'vue';
import type { OImgProps } from './types';

const mediaSizes = useRuntimeConfig().public.cachedImageOptimizerSizes;
const props = defineProps<OImgProps>();

const srcset = computed(() => {
    if (typeof props.srcset === 'number') {
        return getImageSrc(props.srcset, undefined, props.format, props.quality);
    }
    if (typeof props.srcset === 'string') {
        return getImageSrc(Number(props.srcset.replace('px', '')), undefined, props.format, props.quality);
    }
    if (Array.isArray(props.srcset)) {
        return props.srcset.map((width) => `${getImageSrc(width, undefined, props.format, props.quality)} ${width}w`).join(', ');
    }
    return getImageSrc(undefined, undefined, props.format, props.quality);
});

const sizes = computed(() => {
    const sizes = [];
    for (const sizeKey in props.sizes) {
        if (!(mediaSizes as any)[sizeKey]) {
            throw new Error(`Invalid size key: ${sizeKey}`);
        }
        sizes.push(`${(mediaSizes as any)[sizeKey]} ${sizeKey}`);
    }
    if (sizes.length) return sizes.join(', ');
});

const getImageSrc = (width?: number, height?: number, format?: string, quality?: string | number) => {
    const params = new URLSearchParams({ url: props.src || '' });
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (format) params.append('f', format);
    if (quality) params.append('q', quality.toString());
    return `/api/__cimgopt?${params.toString()}`;
};
</script>
