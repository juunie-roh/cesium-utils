import {
  safeSetProperty,
  type SetPropertyResult,
} from "./safe-property-setter.js";
import { isGetterOnly } from "./type-check.js";

export type * from "./type-check.js";
export { isGetterOnly };

export type { SetPropertyResult };
export { safeSetProperty };
