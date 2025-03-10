import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(dirname(fileURLToPath(import.meta.url)), './src')
        }
    },
    server: {
        host: true
    }
});