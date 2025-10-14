<template>
    <img :src :srcset>oimg</img>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    src?: string;
    alt?: string;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: number;
    width?: number;
    height?: number;
    sizes?: {
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
        xxl?: number;
        _?: number;
    };
}>();

const srcset = computed(() => {
    return '';
});
const src = computed(() => {
    if (props.sizes && Object.keys(props.sizes).length > 0) {
        return undefined;
    }
    if (!props.src) {
        return undefined;
    }

    const params = new URLSearchParams({ url: props.src });
    if (props.width) params.append('w', props.width.toString());
    if (props.height) params.append('h', props.height.toString());
    if (props.format) params.append('f', props.format);
    if (props.quality) params.append('q', props.quality.toString());

    return `/api/__cimgopt?${params.toString()}`;
});
</script>
