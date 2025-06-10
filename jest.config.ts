export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: true }],
  },
  moduleNameMapper: {
    "^@/(.*)\\.js$": "<rootDir>/src/$1.ts",
    "^@lib/(.*)\\.js$": "<rootDir>/src/lib/$1.ts",
    "\./setup\.js": "./setup.ts",
  },
  testTimeout: 30000,
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
