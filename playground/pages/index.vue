<template>
    <NuxtLink to="/foo">Foo</NuxtLink>

    <p>Nuxt module playground!</p>
    <OImg
        class="img"
        src="https://placehold.co/4000x2000/png"
        :format
        srcset="4000px"
        quality="100"
        preload
        :role
        :placeholder="{ quality: 40, width: 70 }"
        @load="console.log('image loaded')"
        @load:placeholder="console.log('placeholder loaded')"
    />
    <p>bottom text</p>
    <button @click="changeProp">Change prop</button>
</template>

<script setup lang="ts">
const role = ref("img");
const format = ref<'webp' | 'avif' | 'jpeg' | 'png'>('webp');

const changeProp = () => {
    role.value = 'presentation';
};
</script>

<style scoped lang="css">
.img {
    width: 500px;
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
