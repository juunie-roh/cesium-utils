import { vi } from 'vitest';

const Collection = vi.fn().mockImplementation(() => ({
  add: vi.fn(),
  remove: vi.fn(),
}));

export default Collection;
