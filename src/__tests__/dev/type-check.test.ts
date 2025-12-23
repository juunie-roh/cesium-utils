import { describe, expect, it } from "vitest";

import { isGetterOnly } from "@/utils/type-check.js";

const mock = new (class {
  private _private = "private";
  private _public = "public";
  public = "public";

  get private() {
    return this._private;
  }

  get test() {
    return this._public;
  }
  set test(v: string) {
    this._public = v;
  }
})();

describe("isGetterOnly", () => {
  it("should return true on values that have only getter", () => {
    expect(isGetterOnly(mock, "private")).toBeTruthy();
  });

  it("should return false on public values", () => {
    expect(isGetterOnly(mock, "public")).toBeFalsy();
    expect(isGetterOnly(mock, "test")).toBeFalsy();
  });
});
