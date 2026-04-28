import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Deprecated from "./deprecated.js";

const msg = {
  label: "OldClass",
  since: "0.4.0" as const,
  removedIn: "1.0.0" as const,
};

type Decorate = (target: unknown, context: DecoratorContext) => unknown;

function wrap(options: Deprecated.Options) {
  return Deprecated(options) as Decorate;
}

function classContext(): DecoratorContext {
  return { kind: "class" } as DecoratorContext;
}

function methodContext(): DecoratorContext {
  return { kind: "method" } as DecoratorContext;
}

function accessorContext(): DecoratorContext {
  return { kind: "accessor" } as DecoratorContext;
}

function getterContext(): DecoratorContext {
  return { kind: "getter" } as DecoratorContext;
}

function setterContext(): DecoratorContext {
  return { kind: "setter" } as DecoratorContext;
}

function fieldContext(): DecoratorContext {
  return { kind: "field" } as DecoratorContext;
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
      wrap({ message: msg })(Target, classContext());

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("emits on instantiation", () => {
      class Target {}
      const Wrapper = wrap({ message: msg })(
        Target,
        classContext(),
      ) as new () => unknown;
      new Wrapper();

      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("preserves original class members", () => {
      class Target {
        value = 42;
      }
      const Wrapper = wrap({ message: msg })(
        Target,
        classContext(),
      ) as new () => { value: number };

      expect(new Wrapper().value).toBe(42);
    });
  });

  describe("method", () => {
    it("emits on call", () => {
      function target(this: unknown) {}
      const wrapped = wrap({ message: msg })(
        target,
        methodContext(),
      ) as () => void;
      wrapped.call({});

      expect(warnSpy).toHaveBeenCalledOnce();
    });
  });

  describe("accessor", () => {
    it("emits on get", () => {
      const target: ClassAccessorDecoratorTarget<unknown, number> = {
        get() {
          return 1;
        },
        set() {},
      };
      const result = wrap({ message: msg })(
        target,
        accessorContext(),
      ) as ClassAccessorDecoratorResult<unknown, number>;
      result.get!.call({});

      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("emits on set", () => {
      const target: ClassAccessorDecoratorTarget<unknown, number> = {
        get() {
          return 1;
        },
        set() {},
      };
      const result = wrap({ message: msg })(
        target,
        accessorContext(),
      ) as ClassAccessorDecoratorResult<unknown, number>;
      result.set!.call({}, 42);

      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("preserves the original value on get", () => {
      const target: ClassAccessorDecoratorTarget<unknown, number> = {
        get() {
          return 99;
        },
        set() {},
      };
      const result = wrap({ message: msg })(
        target,
        accessorContext(),
      ) as ClassAccessorDecoratorResult<unknown, number>;

      expect(result.get!.call({})).toBe(99);
    });

    it("emits on init", () => {
      const target: ClassAccessorDecoratorTarget<unknown, number> = {
        get() {
          return 0;
        },
        set() {},
      };
      const result = wrap({ message: msg })(
        target,
        accessorContext(),
      ) as ClassAccessorDecoratorResult<unknown, number>;
      result.init!.call({}, 0);

      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("preserves the initial value on init", () => {
      const target: ClassAccessorDecoratorTarget<unknown, number> = {
        get() {
          return 0;
        },
        set() {},
      };
      const result = wrap({ message: msg })(
        target,
        accessorContext(),
      ) as ClassAccessorDecoratorResult<unknown, number>;

      expect(result.init!.call({}, 42)).toBe(42);
    });
  });

  describe("getter", () => {
    it("emits on get call", () => {
      function target(this: unknown) {
        return 1;
      }
      const wrapped = wrap({ message: msg })(
        target,
        getterContext(),
      ) as () => number;
      wrapped.call({});

      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("preserves the return value", () => {
      function target(this: unknown) {
        return 99;
      }
      const wrapped = wrap({ message: msg })(
        target,
        getterContext(),
      ) as () => number;

      expect(wrapped.call({})).toBe(99);
    });
  });

  describe("setter", () => {
    it("emits on set call", () => {
      function target(this: unknown, _value: number) {}
      const wrapped = wrap({ message: msg })(target, setterContext()) as (
        v: number,
      ) => void;
      wrapped.call({}, 42);

      expect(warnSpy).toHaveBeenCalledOnce();
    });
  });

  describe("field", () => {
    it("emits on field initialization", () => {
      const initializer = wrap({ message: msg })(undefined, fieldContext()) as (
        v: number,
      ) => number;
      initializer.call({}, 0);

      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("preserves the initial value", () => {
      const initializer = wrap({ message: msg })(undefined, fieldContext()) as (
        v: number,
      ) => number;

      expect(initializer.call({}, 42)).toBe(42);
    });
  });

  describe("once behavior", () => {
    it("suppresses subsequent warnings when once=true (default)", () => {
      class Target {}
      const Wrapper = wrap({ message: msg })(
        Target,
        classContext(),
      ) as new () => unknown;
      new Wrapper();
      new Wrapper();

      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("emits every time when once=false", () => {
      class Target {}
      const Wrapper = wrap({ message: msg, once: false })(
        Target,
        classContext(),
      ) as new () => unknown;
      new Wrapper();
      new Wrapper();

      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("shown tracking", () => {
    it("has() returns true after warning is shown", () => {
      class Target {}
      const Wrapper = wrap({ message: msg })(
        Target,
        classContext(),
      ) as new () => unknown;
      new Wrapper();

      expect(Deprecated.has(msg.label)).toBe(true);
    });

    it("has() returns false before any instantiation", () => {
      class Target {}
      wrap({ message: msg })(Target, classContext());

      expect(Deprecated.has(msg.label)).toBe(false);
    });

    it("size() reflects the number of unique labels shown", () => {
      const msgB = { ...msg, label: "OtherClass" };

      class A {}
      class B {}
      const WrapperA = wrap({ message: msg })(
        A,
        classContext(),
      ) as new () => unknown;
      const WrapperB = wrap({ message: msgB })(
        B,
        classContext(),
      ) as new () => unknown;
      new WrapperA();
      new WrapperA();
      new WrapperB();

      expect(Deprecated.size()).toBe(2);
    });

    it("clear() resets size to zero", () => {
      class Target {}
      const Wrapper = wrap({ message: msg })(
        Target,
        classContext(),
      ) as new () => unknown;
      new Wrapper();
      Deprecated.clear();

      expect(Deprecated.size()).toBe(0);
    });

    it("clear() allows warnings to fire again", () => {
      class Target {}
      const Wrapper = wrap({ message: msg })(
        Target,
        classContext(),
      ) as new () => unknown;
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
        classContext(),
      ) as new () => unknown;
      new Wrapper();

      expect(traceSpy).toHaveBeenCalled();
      traceSpy.mockRestore();
    });

    it("includes replacement in the message", () => {
      class Target {}
      const Wrapper = wrap({ message: { ...msg, replacement: "NewClass" } })(
        Target,
        classContext(),
      ) as new () => unknown;
      new Wrapper();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("Use NewClass instead."),
      );
    });
  });
});
