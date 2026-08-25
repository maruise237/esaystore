export const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_PAYLOAD_BYTES = 2 * 1024 * 1024;
export const API_BODY_LIMIT = "4mb";

export function serializedByteLength(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
