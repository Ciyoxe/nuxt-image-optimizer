import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt({
    features: {
        tooling: true,
    },
    dirs: {
        src: ['./playground'],
    },
})
    .append(eslintPluginPrettier)
    .append({
        rules: {
            'vue/multi-word-component-names': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    });
