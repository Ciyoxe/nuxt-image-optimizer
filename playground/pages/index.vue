<template>
    <NuxtLink to="/foo">Foo</NuxtLink>
    <div>Nuxt module playground!</div>
    <OImg
        src="https://placehold.co/4000x2000/png"
        format="avif"
        srcset="500px"
        :placeholder="{ width: 500, quality: 1 }"
        @load="console.log('image loaded')"
        @load:placeholder="console.log('placeholder loaded')"
    />
</template>
