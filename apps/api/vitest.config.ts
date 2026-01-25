import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    // Carregar variáveis de ambiente do arquivo .env.test
    env: {
      ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('TEST_'))),
    },

    // Usar threads ao invés de forks para melhor compatibilidade
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Roda testes em uma única thread
      },
    },

    // Setup e teardown globais
    globalSetup: './tests/setup/global-setup.ts',
    globalTeardown: './tests/setup/global-teardown.ts',
    setupFiles: './tests/setup/suite-setup.ts',

    // Ambiente
    environment: 'node',

    // Timeouts generosos para operações de banco
    testTimeout: 10_000,
    hookTimeout: 30_000,
    teardownTimeout: 5_000,

    // Padrão de arquivos de teste
    include: ['tests/**/*.test.ts'],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/types/**'],
    },

    // Isolamento entre testes
    isolate: true,

    // Reporter
    reporter: 'verbose',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
})
