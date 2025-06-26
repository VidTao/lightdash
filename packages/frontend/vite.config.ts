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
        include: ['react', 'react-dom'],
        force: true,
    },
    build: {
        outDir: 'build',
        emptyOutDir: true,
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: false,
        cssCodeSplit: false,
        chunkSizeWarningLimit: 5000,
        modulePreload: {
            polyfill: true,
        },
        rollupOptions: {
            treeshake: true,
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react')) {
                            return 'react';
                        }
                        return 'vendor';
                    }
                    return null;
                },
                inlineDynamicImports: true,
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]',
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
