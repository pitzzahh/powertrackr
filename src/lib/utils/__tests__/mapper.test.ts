import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getChangedData,
  generateOptions,
  getIcon,
  omit,
  imageFileToDataUrl,
  dataUrlToImageFile,
  mapToType,
} from "$/utils/mapper";

describe("mapper utilities", () => {
  const realFile = (globalThis as any).File;
  const realFileReader = (globalThis as any).FileReader;
  const realAtob = (globalThis as any).atob;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Polyfill minimal `File` API for Node-based tests
    (globalThis as any).File = class {
      parts: any[];
      name: string;
      type: string;
      constructor(parts: any[], name: string, opts?: { type?: string }) {
        this.parts = parts;
        this.name = name;
        this.type = opts?.type ?? "application/octet-stream";
      }
    };

    // Minimal FileReader polyfill that produces a Data URL synchronously via microtask
    (globalThis as any).FileReader = class {
      onloadend: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      result: string | null = null;
      readAsDataURL(file: any) {
        try {
          const part = file.parts?.[0] ?? "";
          // Convert common inputs (Buffer/Uint8Array/string) into base64
          const buf = typeof part === "string" ? Buffer.from(part) : Buffer.from(part || []);
          const base64 = buf.toString("base64");
          this.result = `data:${file.type};base64,${base64}`;
          queueMicrotask(() => {
            if (this.onloadend) this.onloadend();
          });
        } catch (e) {
          queueMicrotask(() => {
            if (this.onerror) this.onerror(e);
          });
        }
      }
    };

    // Minimal atob polyfill using Buffer
    (globalThis as any).atob = (b64: string) => Buffer.from(b64, "base64").toString("binary");
  });

  afterEach(() => {
    // restore globals
    (globalThis as any).File = realFile;
    (globalThis as any).FileReader = realFileReader;
    (globalThis as any).atob = realAtob;
    vi.resetAllMocks();
  });

  it("getChangedData returns filtered original data when newData is empty", () => {
    const original = { a: 1, b: null, c: "", d: "keep", e: 0 };
    const changed = getChangedData(original, {});
    // b and c are filtered out (null and empty string), e=0 should be kept
    expect(changed).toEqual({ a: 1, d: "keep", e: 0 });
  });

  it("getChangedData detects changed values and includes explicit nulls", () => {
    const original = { a: 1, b: 2, c: 3 };
    const newData = { a: 1, b: null, c: 4 } as any;
    const changed = getChangedData(original, newData);
    expect(changed).toEqual({ b: null, c: 4 });
  });

  it("getChangedData returns empty object when there are no changes", () => {
    const original = { a: 1, b: "x" };
    const newData = { a: 1 };
    expect(getChangedData(original, newData)).toEqual({});
  });

  it("generateOptions produces unique, sorted options and supports numeric sorting", () => {
    const data = [{ n: "10" }, { n: "2" }, { n: "3" }, { n: "2" }];
    const opts = generateOptions(data, "n" as any);
    // Labels default to the string values, sorted numerically when possible
    expect(opts.map((o) => o.label)).toEqual(["2", "3", "10"]);
    // Values are unique
    expect(opts.map((o) => o.value)).toEqual(["2", "3", "10"]);
  });

  it("generateOptions supports label_prefix, icon matcher and convert_to_normal_text", () => {
    const data = [{ v: "hello_world" }, { v: "good-bye" }];
    const icons = [
      { value: "hello_world", icon: "H" },
      { value: "good-bye", icon: "G" },
    ];
    const opts = generateOptions(data, "v" as any, {
      icon_matcher: icons as any,
      label_prefix: "PFX",
      convert_to_normal_text: true,
    });
    expect(opts.map((o) => o.label)).toEqual(["PFX Good bye", "PFX Hello world"]);
    expect(opts.map((o) => o.icon)).toEqual(["G", "H"]);
  });

  it("getIcon returns matching icon or undefined", () => {
    const items = [
      { value: "a", icon: "A" },
      { value: "b", icon: "B" },
    ];
    expect(getIcon(items as any, "a")).toBe("A");
    expect(getIcon(items as any, "x")).toBeUndefined();
  });

  it("omit removes string keys but retains symbol keys when not omitted", () => {
    const sym = Symbol("s");
    const obj: any = { a: 1, b: 2 };
    obj[sym] = 3;
    const result = omit(obj, ["b"] as any);
    expect((result as any).a).toBe(1);
    expect((result as any)[sym]).toBe(3);
    expect((result as any).b).toBeUndefined();
  });

  it("imageFileToDataUrl converts a File to a data URL", async () => {
    const buf = Buffer.from("hello");
    const file = new (globalThis as any).File([buf], "test.txt", { type: "text/plain" });
    const dataUrl = await imageFileToDataUrl(file as unknown as File);
    expect(dataUrl.startsWith("data:text/plain;base64,")).toBeTruthy();
    expect(dataUrl).toContain(buf.toString("base64"));
  });

  it("imageFileToDataUrl throws when no file provided", async () => {
    // @ts-ignore
    await expect(imageFileToDataUrl(null)).rejects.toThrow("No file provided");
  });

  it("dataUrlToImageFile converts a data URL into a File-like object", () => {
    const raw = "Hello!";
    const b64 = Buffer.from(raw).toString("base64");
    const dataUrl = `data:text/plain;base64,${b64}`;
    const file = dataUrlToImageFile(dataUrl, "out.txt");
    expect(file.name).toBe("out.txt");
    expect((file as any).type).toBe("text/plain");
    // The underlying data should match the original length
    const part = (file as any).parts?.[0];
    expect(part instanceof Uint8Array || Buffer.isBuffer(part)).toBeTruthy();
    const asBuf = Buffer.from(part);
    expect(asBuf.toString()).toBe(raw);
  });

  it("dataUrlToImageFile throws on invalid inputs", () => {
    expect(() => dataUrlToImageFile("not-a-data-url")).toThrow("Invalid data URL");
    expect(() => dataUrlToImageFile("data:;base64,")).toThrow("Invalid data URL format");
  });

  it("mapToType returns allowed value or throws", () => {
    const allowed = ["a", "b"] as const;
    expect(mapToType("a", allowed as any)).toBe("a");
    expect(() => mapToType("c" as any, allowed as any)).toThrowError("Invalid value: c");
  });
});
