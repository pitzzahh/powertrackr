import type { FilterOption } from "$/types/filter";
import { convertToNormalText } from "$/utils/text";

/**
 * A generic function to compare two objects and return the properties that have changed.
 * If newData is empty, it will return all properties from originalData as changes.
 *
 * @param originalData - The original object (e.g., current data from the database).
 * @param newData - The new object (e.g., the updated data to be compared).
 * @returns A partial object containing only the properties that have changed between the two objects.
 *          If no changes are found and newData is empty, return all properties from originalData.
 *          If no changes are found but newData is not empty, return an empty object.
 *
 * @template T - The type of the objects being compared.
 */
export function getChangedData<T>(
  originalData: T,
  newData: Partial<T>,
): Partial<T> {
  const changedData: Partial<T> = {};

  // If newData is empty, filter non-nullish properties from originalData
  if (Object.keys(newData).length === 0) {
    const filteredOriginal: Partial<T> = {};
    for (const key in originalData) {
      if (originalData[key] != null && originalData[key] !== "") {
        filteredOriginal[key] = originalData[key];
      }
    }
    return filteredOriginal;
  }

  // Iterate over the keys in newData to check for changes
  for (const key in newData) {
    // Check if the key exists in newData (to avoid comparing prototype keys)
    if (Object.prototype.hasOwnProperty.call(newData, key)) {
      // Compare using JSON.stringify to handle objects and arrays correctly
      const originalValue = originalData[key];
      const newValue = newData[key];

      // Consider cases where:
      // 1. The value has changed
      // 2. Original value was empty/null/undefined but new value exists
      // 3. Original value existed but new value is empty/null/undefined
      if (
        JSON.stringify(originalValue) !== JSON.stringify(newValue) ||
        ((!originalValue || originalValue === "") && newValue) ||
        (originalValue && (!newValue || newValue === ""))
      ) {
        // Include explicit null values as well as non-nullish values
        if (newValue !== undefined && (newValue !== "" || newValue === null)) {
          changedData[key] = newValue;
        }
      }
    }
  }

  // Check for fields in originalData that don't exist in newData
  for (const key in originalData) {
    if (
      Object.prototype.hasOwnProperty.call(originalData, key) &&
      !Object.prototype.hasOwnProperty.call(newData, key) &&
      originalData[key] != null &&
      originalData[key] !== ""
    ) {
      // Skip adding undefined values
      continue;
    }
  }

  // Return an empty object if no changes are found
  return Object.keys(changedData).length === 0 ? {} : changedData;
}

export function generateOptions<T, FilterType = string>(
  data: T[],
  key: keyof T,
  options?: {
    icon_matcher?: FilterOption<FilterType>[];
    label_prefix?: string;
    convert_to_normal_text?: boolean;
  },
): FilterOption<string | FilterType>[] {
  const { icon_matcher, label_prefix, convert_to_normal_text } = options || {};
  return Array.from(
    new Map(
      data.map((option) => {
        // Convert value to string first, especially if it's a number
        const rawValue = option[key];
        const stringValue =
          typeof rawValue === "number"
            ? String(rawValue)
            : (rawValue as unknown as string);
        const _value = convert_to_normal_text
          ? convertToNormalText(stringValue as unknown as FilterType)
          : stringValue;

        return [
          _value,
          {
            value: _value,
            label: label_prefix ? `${label_prefix} ${_value}` : _value,
            icon: icon_matcher ? getIcon(icon_matcher, stringValue) : undefined,
          },
        ];
      }),
    ).values(),
  ).sort((a, b) => {
    const aLabel = typeof a.label === "boolean" ? String(a.label) : a.label;
    const bLabel = typeof b.label === "boolean" ? String(b.label) : b.label;

    // Handle null labels
    if (!aLabel || !bLabel) {
      return (aLabel || "").localeCompare(bLabel || "", undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    const numA = parseFloat(aLabel.match(/\d+(\.\d+)?/)?.[0] || "NaN");
    const numB = parseFloat(bLabel.match(/\d+(\.\d+)?/)?.[0] || "NaN");

    // Determine sorting method: numeric if both labels contain numbers, otherwise lexicographic
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB; // Numeric comparison
    }
    return aLabel.localeCompare(bLabel, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

export function getIcon<FilterType>(
  items: Array<FilterOption<FilterType>>,
  value: string,
) {
  const status = items.find((s) => s.value === value);
  return status?.icon;
}

/**
 * A utility function to omit specified keys from an object.
 * @param obj The object from which keys will be omitted.
 * @param keysToOmit An array of keys to omit from the object.
 * @returns A new object with the specified keys omitted.
 * @example
 * const myObj = { a: 1, b: 'hello', c: true };
 * const newObj = omit(myObj, ['b']);
 * // newObj will be { a: 1, c: true }
 *
 * @example
 * const anotherObj = { name: 'John', age: 30, city: 'New York', country: 'USA' };
 * const partialObj = omit(anotherObj, ['city', 'country']);
 * // partialObj will be { name: 'John', age: 30 }
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keysToOmit: K[],
): Omit<T, K> {
  const newObj: Partial<T> = {};
  const keysToOmitStr = keysToOmit.map(String);

  // Handle string keys
  for (const key in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      !keysToOmitStr.includes(String(key))
    ) {
      newObj[key] = obj[key];
    }
  }

  // Handle symbol keys
  const symbolKeys = Object.getOwnPropertySymbols(obj);
  for (const symKey of symbolKeys) {
    if (!keysToOmit.includes(symKey as any)) {
      (newObj as any)[symKey] = (obj as any)[symKey];
    }
  }

  return newObj as Omit<T, K>;
}

export async function imageFileToDataUrl(file: File) {
  if (!file) {
    throw new Error("No file provided");
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to data URL"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataUrlToImageFile(
  dataUrl: string,
  filename = "image.png",
): File {
  if (!dataUrl.startsWith("data:")) {
    throw new Error("Invalid data URL");
  }

  const [header, base64] = dataUrl.split(",");
  const match = header.match(/data:(.*);base64/);

  if (!match || !base64) {
    throw new Error("Invalid data URL format");
  }

  const mimeType = match[1];
  const binary = atob(base64);
  const len = binary.length;
  const u8arr = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    u8arr[i] = binary.charCodeAt(i);
  }

  return new File([u8arr], filename, { type: mimeType });
}
