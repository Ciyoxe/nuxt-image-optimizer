<template>
    <NuxtLink to="/foo">Foo</NuxtLink>

    <p>Nuxt module playground!</p>
    <OImg
        class="img"
        src="https://placehold.co/4000x2000/png"
        format="avif"
        srcset="1000px"
        :placeholder="{ quality: 40, width: 70 }"
        @load="console.log('image loaded')"
        @load:placeholder="console.log('placeholder loaded')"
    />
    <p>bottom text</p>
</template>

<style scoped lang="css">
.img {
    width: 500px;
    transition: filter 0.3s ease-in-out;
}
</style>
