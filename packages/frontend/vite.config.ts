import { sentryVitePlugin } from '@sentry/vite-plugin';
import reactPlugin from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import svgrPlugin from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    publicDir: 'public',
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    plugins: [
        svgrPlugin(),
        reactPlugin(),
        compression({
            include: [/\.(js)$/, /\.(css)$/],
            filename: '[path][base].gzip',
        }),
        monacoEditorPlugin({
            forceBuildCDN: true,
            languageWorkers: ['json'],
        }),
        sentryVitePlugin({
            org: 'lightdash',
            project: 'lightdash-frontend',
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: {
                name: process.env.SENTRY_RELEASE_VERSION,
                inject: true,
            },
            sourcemaps: {
                disable: true,
            },
        }),
    ],
    css: {
        transformer: 'lightningcss',
    },
    optimizeDeps: {
        exclude: ['@lightdash/common'],
        include: ['react', 'react-dom', 'react-router-dom'],
        force: true,
    },
    build: {
        outDir: 'build',
        emptyOutDir: true,
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: true,
        cssCodeSplit: true,
        chunkSizeWarningLimit: 5000,
        rollupOptions: {
            treeshake: true,
            output: {
                manualChunks: {
                    'react-vendor': [
                        'react',
                        'react-dom',
                        'react-router-dom',
                        'react-router',
                        'react-query',
                    ],
                    'mantine-vendor': [
                        '@mantine/core',
                        '@mantine/hooks',
                        '@mantine/form',
                        '@mantine/notifications',
                    ],
                    'echarts-vendor': ['echarts'],
                },
                inlineDynamicImports: false,
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/testing/vitest.setup.ts',
    },
    server: {
        port: 3000,
        host: true,
        watch: {
            usePolling: true,
            interval: 1000,
        },
        hmr: {
            overlay: true,
            clientPort: 3000,
            host: '0.0.0.0',
        },
        allowedHosts: ['lightdash-dev', '.lightdash.dev'],
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
            '/slack/events': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
    clearScreen: false,
});
