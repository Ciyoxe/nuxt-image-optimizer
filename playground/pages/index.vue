<template>
    <NuxtLink to="/foo">Foo</NuxtLink>

    <p>Nuxt module playground!</p>
    <OImg
        v-for="image in images"
        :key="image"
        class="img"
        :src="image"
        format="jpeg"
        quality="100"
        sizes="100vw"
        srcset="400, 500, 600, 1000"
        loading="lazy"
        placeholder="40, 70, 80, 90, 100"
    />
</template>

<script setup lang="ts">
const images = new Array(20).fill(0).map((_, index) => `https://placehold.co/${3000 + index}x2000/png`);
</script>

<style scoped lang="css">
.img {
    width: 100vw;
    transition: opacity 0.1s ease-in-out;
    opacity: 0.8;
}

.img[data-status='placeholder'] {
    opacity: 0.5;
}

.img[data-status='completed'] {
    opacity: 1;
}
</style>
