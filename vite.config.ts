import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [tailwindcss(), reactRouter(), basicSsl()],
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        host: true,
    },
});
