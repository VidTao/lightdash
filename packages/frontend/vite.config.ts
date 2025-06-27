import { sentryVitePlugin } from '@sentry/vite-plugin';
import reactPlugin from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import svgrPlugin from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    root: __dirname,
    publicDir: 'public',
    define: {
        __APP_VERSION__: JSON.stringify(
            process.env.npm_package_version || '0.1627.0',
        ),
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
            // Sourcemaps are already uploaded by the Sentry CLI
            sourcemaps: {
                disable: true,
            },
        }),
    ],
    css: {
        transformer: 'lightningcss',
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router',
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/form',
            '@mantine-8/core',
            '@mantine-8/hooks',
            '@tanstack/react-query',
        ],
        exclude: ['@lightdash/common'],
        esbuildOptions: {
            target: 'es2020',
            supported: {
                'top-level-await': true,
            },
            logLevel: 'debug',
        },
    },
    esbuild: {
        logLevel: 'debug',
        target: 'es2020',
        supported: {
            'top-level-await': true,
        },
    },
    build: {
        outDir: 'build',
        emptyOutDir: false,
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: true,
        rollupOptions: {
            external: [
                '@mantine/hooks',
                '@mantine/core',
                '@mantine-8/hooks',
                '@mantine-8/core',
            ],
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react')) return 'react-vendor';
                        if (id.includes('@mantine')) return 'mantine-vendor';
                        if (id.includes('echarts')) return 'echarts-vendor';
                        if (id.includes('@tanstack')) return 'tanstack-vendor';
                        return 'vendor';
                    }
                },
            },
            onwarn(warning, warn) {
                // Ignore specific warnings
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
                if (warning.message.includes('use client')) return;
                warn(warning);
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
        host: '0.0.0.0',
        watch: {
            usePolling: false,
        },
        hmr: {
            overlay: false,
            clientPort: 3000,
            host: '0.0.0.0',
        },
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        allowedHosts: [
            'lightdash-dev',
            '.lightdash.dev',
            'v2.bratrax.com',
            'localhost',
        ],
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
