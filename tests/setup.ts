/**
 * Jest setup file
 */

// Mock chalk to avoid ESM import issues
jest.mock('chalk', () => {
  const mockChalk = (str: string) => str;
  mockChalk.bold = (str: string) => str;
  mockChalk.dim = (str: string) => str;
  mockChalk.red = (str: string) => str;
  mockChalk.green = (str: string) => str;
  mockChalk.yellow = (str: string) => str;
  mockChalk.blue = (str: string) => str;
  mockChalk.cyan = (str: string) => str;

  return {
    default: mockChalk,
    __esModule: true,
  };
});
