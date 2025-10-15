<template>
    <img
        ref="img"
        class="o-img"
        v-bind="$attrs"
        :style
        :srcset
        :sizes
        :alt
        :role
        @load="onImageLoad"
        @error="onImageError"
        data-allow-mismatch="true"
        onload="if (this.attributes['data-status']?.textContent === 'placeholder') { this.setAttribute('data-status', 'completed') } else { this.setAttribute('data-status', 'placeholder') }"
        onerror="this.setAttribute('data-status', 'error')"
    />
</template>

<script setup lang="ts">
import { useFetch, useRuntimeConfig } from '#app';
import { computed, onMounted, ref, watch } from 'vue';
import type { OImgProps } from './types';

const mediaSizes = useRuntimeConfig().public.cachedImageOptimizerSizes;
const props = defineProps<OImgProps>();
const emit = defineEmits(['load', 'load:placeholder', 'error', 'error:placeholder']);

const img = ref<HTMLImageElement>();
const placeholderShown = ref(Boolean(props.placeholder));

onMounted(() => {
    if (placeholderShown.value) {
        const image = new Image();
        image.sizes = sizes.value ?? '';
        image.srcset = originalSrcset.value;

        image.onload = () => {
            image.remove();
            placeholderShown.value = false;
        };
        image.onerror = () => {
            image.remove();
            emit('error');
        };
    }
});

const srcset = computed(() => {
    if (placeholderShown.value) {
        return placeholderSrcset.value;
    }

    return originalSrcset.value;
});

const placeholderSrcset = computed(() => {
    if (props.placeholder) {
        return getImageSrc(props.placeholder.width, props.placeholder.height, props.format, props.placeholder.quality ?? props.quality);
    }
    return '';
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
    const sizes = [];
    for (const sizeKey in props.sizes) {
        if (!(mediaSizes as any)[sizeKey]) {
            throw new Error(`Invalid size key: ${sizeKey}`);
        }
        sizes.push(`${(mediaSizes as any)[sizeKey]} ${sizeKey}`);
    }
    if (sizes.length) return sizes.join(', ');
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
    return props.alt ? undefined : 'presentation';
});

const onImageLoad = () => {
    if (placeholderShown.value) {
        emit('load:placeholder');
    } else {
        emit('load');
    }
};

const onImageError = () => {
    if (placeholderShown.value) {
        emit('error:placeholder');
    } else {
        emit('error');
    }
};

// if image loaded while component wasn't hydrated, it won't emit @load vue event
watch(
    img,
    (img) => {
        if (img?.complete) {
            if (img.naturalWidth && img.naturalHeight) {
                onImageLoad();
            } else {
                onImageError();
            }
        }
    },
    { immediate: true },
);

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
</script>

<style scoped lang="css" src="./styles.css" />
