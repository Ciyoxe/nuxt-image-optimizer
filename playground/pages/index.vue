<template>
    <NuxtLink to="/foo">Foo</NuxtLink>
    <div>Nuxt module playground!</div>
    <OImg
        src="https://placehold.co/4000x4000/png"
        format="avif"
        srcset="2000px"
        @load="console.log('image loaded')"
        @load:placeholder="console.log('placeholder loaded')"
    />
</template>
