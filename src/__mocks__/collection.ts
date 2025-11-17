import { type Mock, vi } from "vitest";

const Collection: Mock = vi.fn().mockImplementation(() => ({
  add: vi.fn(),
  remove: vi.fn(),
}));

export default Collection;
