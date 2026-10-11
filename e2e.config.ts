import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

/**
 * Configuración oficial de e2e (tester-army/e2e v0.18.0)
 * para Albion Farm & Economy Tracker
 */
export default {
  tests: 'tests/**/*.e2e.ts',
  targets: [
    {
      name: 'web-local',
      engine: web(),
      app: {
        url: 'http://127.0.0.1:3000',
        command: {
          executable: 'npm',
          args: ['run', 'dev'],
          reuseExisting: true,
          log: '.e2e/logs/app.log',
        },
      },
    },
  ],
  output: '.e2e',
  timeout: 60000,
  actionTimeout: 15000,
  assertionTimeout: 5000,
  reporters: ['list'],
} satisfies E2EConfig;
