export function convertToNormalText(
  text: unknown,
  include_separators: boolean = false,
  separators: string[] = []
): string {
  const textStr = String(text);
  let trimmedText = textStr.trim().replaceAll("_", " ").replaceAll("-", " ");

  if (include_separators && separators.length > 0) {
    for (const separator of separators) {
      trimmedText = trimmedText.replaceAll(separator, " ");
    }
  }

  return trimmedText.charAt(0).toUpperCase() + trimmedText.slice(1).toLowerCase();
}

// TODO: Test getInitials function\
export const getInitials = (name: string | undefined) => {
  if (!name) return "";
  const names = name.trim().split(/\s+/).filter(Boolean);
  if (names.length === 0) return "";

  let initials = names[0].substring(0, 1).toUpperCase();

  if (names.length === 3) {
    initials += names[1].substring(0, 1).toUpperCase();
  } else if (names.length >= 4) {
    initials += names[1].substring(0, 1).toUpperCase();
  } else if (names.length >= 2) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  } else {
    initials += names[0].substring(0, 1).toUpperCase();
  }
  return initials;
}; /**
 * Extracts the first token from a given path string.
 *
 * @param path - The input path string.
 * @returns The first token in the path.
 */
// TODO: Test extractMainRoute function
export const extractMainRoute = (path: string): string => {
  if (path === "/") {
    return "/";
  }

  const tokens = path.split("/").filter((token) => token);

  return tokens.length > 0 ? `/${tokens[0]}` : "";
};
// TODO: Test generateNotFoundMessage function
export function generateNotFoundMessage<T extends object>(query: T): string {
  const fields = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (value instanceof Date) {
        return `${key}: ${value.toISOString().split("T")[0]}`;
      }
      return `${key}: ${value}`;
    });

  return `${fields.join(" or ")} not found.`;
}

export function toShortName(fullName: string): string {
  if (!fullName || typeof fullName !== "string") return "";

  const parts = fullName
    .trim()
    .replace(/\./g, " ")
    .replace(/[^a-zA-Z0-9-]/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) return "";

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  const first = parts[0][0].toUpperCase();
  const lastPart = parts[parts.length - 1];
  const lastChar = /^[A-Za-z]/.exec(lastPart);
  const second = lastChar ? lastChar[0].toUpperCase() : lastPart[0].toUpperCase();

  return first + second;
}
