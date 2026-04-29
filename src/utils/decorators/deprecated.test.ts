import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Deprecated from "./deprecated.js";

const msg = {
  label: "OldClass",
  since: "0.4.0" as const,
  removedIn: "1.0.0" as const,
};

type LegacyDecorator = (
  target: any,
  key?: string | symbol,
  descriptor?: PropertyDescriptor,
) => any;

function wrap(options: Deprecated.Options): LegacyDecorator {
  return Deprecated(options) as LegacyDecorator;
}

describe("Deprecated decorator", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Deprecated.clear();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe("class", () => {
    it("does not emit at decoration time", () => {
      class Target {}
      wrap({ message: msg })(Target);

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("emits on instantiation", () => {
      class Target {}
      const Wrapper = wrap({ message: msg })(Target) as new () => unknown;
      new Wrapper();

      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("preserves original class members", () => {
      class Target {
        value = 42;
      }
      const Wrapper = wrap({ message: msg })(Target) as new () => {
        value: number;
      };

      expect(new Wrapper().value).toBe(42);
    });
  });

  describe("method", () => {
    it("emits on call", () => {
      const proto = {};
      const desc: PropertyDescriptor = {
        value: function (this: unknown) {},
        configurable: true,
      };
      const newDesc = wrap({ message: msg })(
        proto,
        "method",
        desc,
      ) as PropertyDescriptor;
      (newDesc.value as () => void).call({});

      expect(warnSpy).toHaveBeenCalledOnce();
    });
  });

  describe("getter", () => {
    it("emits on get call", () => {
      const proto = {};
      const desc: PropertyDescriptor = {
        get() {
          return 1;
        },
        configurable: true,
      };
      const newDesc = wrap({ message: msg })(
        proto,
        "prop",
        desc,
      ) as PropertyDescriptor;
      newDesc.get!.call({});

      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("preserves the return value", () => {
      const proto = {};
      const desc: PropertyDescriptor = {
        get() {
          return 99;
        },
        configurable: true,
      };
      const newDesc = wrap({ message: msg })(
        proto,
        "prop",
        desc,
      ) as PropertyDescriptor;

      expect(newDesc.get!.call({})).toBe(99);
    });
  });

  describe("setter", () => {
    it("emits on set call", () => {
      const proto = {};
      const desc: PropertyDescriptor = {
        set(this: unknown, _value: number) {},
        configurable: true,
      };
      const newDesc = wrap({ message: msg })(
        proto,
        "prop",
        desc,
      ) as PropertyDescriptor;
      newDesc.set!.call({}, 42);

      expect(warnSpy).toHaveBeenCalledOnce();
    });
  });

  describe("field", () => {
    it("emits at decoration time", () => {
      wrap({ message: msg })({}, "field");

      expect(warnSpy).toHaveBeenCalledOnce();
    });
  });

  describe("once behavior", () => {
    it("suppresses subsequent warnings when once=true (default)", () => {
      class Target {}
      const Wrapper = wrap({ message: msg })(Target) as new () => unknown;
      new Wrapper();
      new Wrapper();

      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("emits every time when once=false", () => {
      class Target {}
      const Wrapper = wrap({ message: msg, once: false })(
        Target,
      ) as new () => unknown;
      new Wrapper();
      new Wrapper();

      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("shown tracking", () => {
    it("has() returns true after warning is shown", () => {
      class Target {}
      const Wrapper = wrap({ message: msg })(Target) as new () => unknown;
      new Wrapper();

      expect(Deprecated.has(msg.label)).toBe(true);
    });

    it("has() returns false before any instantiation", () => {
      class Target {}
      wrap({ message: msg })(Target);

      expect(Deprecated.has(msg.label)).toBe(false);
    });

    it("size() reflects the number of unique labels shown", () => {
      const msgB = { ...msg, label: "OtherClass" };
      class A {}
      class B {}
      const WrapperA = wrap({ message: msg })(A) as new () => unknown;
      const WrapperB = wrap({ message: msgB })(B) as new () => unknown;
      new WrapperA();
      new WrapperA();
      new WrapperB();

      expect(Deprecated.size()).toBe(2);
    });

    it("clear() resets size to zero", () => {
      class Target {}
      const Wrapper = wrap({ message: msg })(Target) as new () => unknown;
      new Wrapper();
      Deprecated.clear();

      expect(Deprecated.size()).toBe(0);
    });

    it("clear() allows warnings to fire again", () => {
      class Target {}
      const Wrapper = wrap({ message: msg })(Target) as new () => unknown;
      new Wrapper();
      Deprecated.clear();
      new Wrapper();

      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("options", () => {
    it("calls console.trace when includeStack=true", () => {
      const traceSpy = vi.spyOn(console, "trace").mockImplementation(() => {});
      class Target {}
      const Wrapper = wrap({ message: msg, includeStack: true })(
        Target,
      ) as new () => unknown;
      new Wrapper();

      expect(traceSpy).toHaveBeenCalled();
      traceSpy.mockRestore();
    });

    it("includes replacement in the message", () => {
      class Target {}
      const Wrapper = wrap({ message: { ...msg, replacement: "NewClass" } })(
        Target,
      ) as new () => unknown;
      new Wrapper();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("Use NewClass instead."),
      );
    });
  });
});
