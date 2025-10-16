<template>
    <img
        class="o-img"
        v-bind="$attrs"
        data-allow-mismatch
        :style
        :srcset="placeholderSrcset ?? originalSrcset"
        :sizes
        :alt
        :role
        :data-oimg-srcset="originalSrcset"
        :data-oimg-placeholder="placeholderSrcset"
        onload="if (this.srcset === this.dataset.oimgPlaceholder) { this.dataset.status = 'placeholder'; this.srcset = this.dataset.oimgSrcset } else { this.dataset.status = 'completed' }"
        onerror="if (this.srcset === this.dataset.oimgPlaceholder) { this.srcset = this.dataset.oimgSrcset } else { this.dataset.status = 'error' }"
    />
</template>

<script setup lang="ts">
import { useFetch, useHead, useRuntimeConfig } from '#app';
import { computed } from 'vue';
import type { OImgProps } from './types';

const mediaSizes = useRuntimeConfig().public.cachedImageOptimizerSizes;
const props = defineProps<OImgProps>();
const emit = defineEmits(['load', 'load:placeholder', 'error', 'error:placeholder']);

const placeholderSrcset = computed(() => {
    if (props.placeholder) {
        return getImageSrc(props.placeholder.width, props.placeholder.height, props.format, props.placeholder.quality ?? props.quality);
    }
});

const originalSrcset = computed(() => {
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
    if (typeof props.sizes === 'string') {
        return props.sizes;
    }

    if (!props.sizes || Object.keys(props.sizes).length === 0) {
        return undefined;
    }

    return Object.entries(props.sizes)
        .map(([key, val]) => {
            if (!(mediaSizes as any)[key]) {
                throw new Error(`Invalid size key: ${key}`);
            }
            return `${(mediaSizes as any)[key]} ${typeof val === 'number' ? `${val}px` : val}`;
        })
        .join(', ');
});

const alt = computed(() => {
    if (props.alt) {
        return props.alt;
    }
    return '';
});

const role = computed(() => {
    if (props.role) {
        return props.role;
    }
    return props.alt ? 'img' : 'presentation';
});

const getImageSrc = (width?: number, height?: number, format?: string, quality?: string | number) => {
    const params = new URLSearchParams({ url: props.src || '' });
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (format) params.append('f', format);
    if (quality) params.append('q', quality.toString());
    return `/api/__cimgopt?${params.toString()}`;
};

const getImageSizesSrc = (width?: number, height?: number, format?: string, quality?: string | number) => {
    const params = new URLSearchParams({ url: props.src || '' });
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (format) params.append('f', format);
    if (quality) params.append('q', quality.toString());
    return `/api/__cimgopt-size?${params.toString()}`;
};

// get any src to retrieve image sizes (i hope, from cache)
// if there is no placeholder or srcset, use query with url only (highly-likely cache miss and refetch on backend)
const getAnySrcForSizes = () => {
    if (props.placeholder) {
        return getImageSizesSrc(
            props.placeholder.width,
            props.placeholder.height,
            props.format,
            props.placeholder.quality ?? props.quality,
        );
    }
    if (typeof props.srcset === 'number') {
        return getImageSizesSrc(props.srcset, undefined, props.format, props.quality);
    }
    if (typeof props.srcset === 'string') {
        return getImageSizesSrc(Number(props.srcset.replace('px', '')), undefined, props.format, props.quality);
    }
    if (Array.isArray(props.srcset) && props.srcset.length) {
        return getImageSizesSrc(props.srcset[0], undefined, props.format, props.quality);
    }
    return getImageSizesSrc(undefined, undefined, props.format, props.quality);
};

// api endpoint returns original image sizes, so, we don't care about conversion settings
const { data: ssrSize } = await useFetch<{ w: number; h: number }>(getAnySrcForSizes(), {
    key: () => `oimg-ssr-size-${props.src}`,
    watch: [() => props.src],
});

const style = computed(() => {
    return {
        '--original-width': ssrSize.value ? ssrSize.value.w : undefined,
        '--original-height': ssrSize.value ? ssrSize.value.h : undefined,
        '--aspect-ratio': ssrSize.value ? ssrSize.value.w / ssrSize.value.h : undefined,
    };
});

if (props.preload) {
    const link = [
        {
            rel: 'preload',
            as: 'image',
            imagesizes: sizes.value,
            imagesrcset: originalSrcset.value,
            fetchpriority: 'high',
        },
    ];
    if (placeholderSrcset.value) {
        link.push({
            rel: 'preload',
            as: 'image',
            imagesizes: sizes.value,
            imagesrcset: placeholderSrcset.value,
            fetchpriority: 'high',
        });
    }
    useHead({ link: link as any });
}
</script>

<style scoped lang="css" src="./styles.css" />
