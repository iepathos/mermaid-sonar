/**
 * Mock implementation of isomorphic-dompurify for testing
 */

const createDOMPurify = (_window: unknown) => ({
  sanitize: (input: string) => input,
  addHook: () => {},
});

export default createDOMPurify;
