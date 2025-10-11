import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt({
    features: {
        tooling: true,
    },
    dirs: {
        src: ['./playground'],
    },
}).append(eslintPluginPrettier);
