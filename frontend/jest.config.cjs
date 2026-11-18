module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  moduleFileExtensions: ['js', 'jsx'],
  transform: { '^.+\\.(js|jsx)$': 'babel-jest' },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
