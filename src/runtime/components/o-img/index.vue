<template>
    <img
        ref="img"
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
        @load="handleLoad"
        @error="handleError"
        onload="this.srcset===this.dataset.oimgPlaceholder?(this.dataset.status='placeholder',this.srcset=this.dataset.oimgSrcset):this.dataset.status='completed'"
        onerror="this.srcset===this.dataset.oimgPlaceholder?this.srcset=this.dataset.oimgSrcset:this.dataset.status='error'"
    />
</template>

<script setup lang="ts">
import { useFetch, useHead, useRuntimeConfig } from '#app';
import { ref, computed, onMounted } from 'vue';
import type { OImgProps } from './types';

const mediaSizes = useRuntimeConfig().public.cachedImageOptimizerSizes;
const props = defineProps<OImgProps>();
const emit = defineEmits(['load', 'load:placeholder', 'error']);

const img = ref<HTMLImageElement>();

onMounted(() => {
    // re-emit events if image was loaded before hydration
    if (img.value) {
        switch (img.value.dataset.status) {
            case 'placeholder':
                emit('load:placeholder');
                break;
            case 'completed':
                emit('load:placeholder');
                emit('load');
                break;
            case 'error':
                emit('error');
                break;
        }
    }
});

const handleLoad = () => {
    if (!img.value) return;

    if (!img.value.dataset.status) {
        emit('load:placeholder');
    } else {
        emit('load');
    }
};

const handleError = () => {
    if (!img.value) return;

    if (img.value.srcset !== img.value.dataset.oimgPlaceholder) {
        emit('error');
    }
};

const placeholderSrcset = computed(() => {
    if (!props.placeholder) {
        return;
    }
    const [quality, width, height] = props.placeholder.split(',').map((s) => s.trim());
    return getImageSrc(width, height, props.format, quality ?? props.quality);
});

const originalSrcset = computed(() => {
    if (!props.srcset) {
        return getImageSrc(undefined, undefined, props.format, props.quality);
    }
    return props.srcset
        .split(',')
        .map((width) => width.trim())
        .map((width) => `${getImageSrc(width, undefined, props.format, props.quality)} ${width}w`)
        .join(', ');
});

const sizes = computed(() => {
    if (!props.sizes) {
        return;
    }
    const sizesMap = props.sizes.split(',').map((s) => s.trim().split(':').map((s) => s.trim()));

    // move values without keys to end (fallback sizes)
    for (let i = 0; i < sizesMap.length; i++) {
        if (!sizesMap[i]![1]) {
            sizesMap.push(sizesMap.splice(i, 1)[0]!);
        }
    }

    return sizesMap.map(([key, value]) => {
        // fallback size
        if (!value) {
            return key;
        }

        // size with media query
        const mediaQuery = (mediaSizes as any)[key!];
        if (!mediaQuery) {
            throw new Error(`Invalid media query key: ${key} in sizes: ${props.sizes}`);
        }
        return `${mediaQuery} ${value}`;
    }).join(', ');
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

const getImageSrc = (width?: string, height?: string, format?: string, quality?: string) => {
    const params = new URLSearchParams({ url: props.src || '' });
    if (width) params.append('w', width);
    if (height) params.append('h', height);
    if (format) params.append('f', format);
    if (quality) params.append('q', quality);
    return `/api/__cimgopt?${params.toString()}`;
};

const getImageSizesSrc = (width?: string, height?: string, format?: string, quality?: string) => {
    const params = new URLSearchParams({ url: props.src || '' });
    if (width) params.append('w', width);
    if (height) params.append('h', height);
    if (format) params.append('f', format);
    if (quality) params.append('q', quality);
    return `/api/__cimgopt-size?${params.toString()}`;
};

// get any src to retrieve image sizes (i hope, from cache)
// in rare cases, it may be not cached, so we need to refetch image on backend
// api endpoint returns original image sizes, so, we don't care about conversion settings
const getAnySrcForSizes = () => {
    const firstWidth = props.srcset?.split(' ')[0];
    if (firstWidth) {
        return getImageSizesSrc(firstWidth, undefined, props.format, props.quality);
    }
    return getImageSizesSrc(undefined, undefined, props.format, props.quality);
};

const { data: ssrSize } = await useFetch<{ w: number; h: number }>(getAnySrcForSizes(), {
    key: () => `oimg-ssr-size-${props.src}`,
    watch: [() => props.src],
});

const style = computed(() => {
    if (ssrSize.value) {
        return {
            '--original-width': ssrSize.value.w,
            '--original-height': ssrSize.value.h,
            '--aspect-ratio': ssrSize.value.w / ssrSize.value.h,
        };
    }
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
