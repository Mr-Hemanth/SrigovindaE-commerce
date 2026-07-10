const nextJest = require('next/jest');

// Note: intentionally NOT passing `{ dir: './' }` here. When a `dir` is
// provided, next/jest calls Next's `findPagesDir`, which throws if it finds
// both an `app` directory and a `pages` directory (even an empty/unused one)
// that aren't siblings under the same parent. This repo has a leftover,
// already-emptied `src/pages/...` file from the in-progress CRA -> Next
// migration (everything else under `src/` has already been deleted; that
// cleanup is out of scope here) which trips that check. Omitting `dir` skips
// next.config.js/jsconfig.json auto-loading (not needed since `@/*` module
// resolution is declared explicitly in moduleNameMapper below) but keeps
// next/jest's SWC-based transform, CSS/image/font mocks, and other defaults.
const createJestConfig = nextJest({});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

// createJestConfig is exported this way to ensure next/jest can load the Next.js config, which is async
module.exports = createJestConfig(customJestConfig);
