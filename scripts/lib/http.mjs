import { USER_AGENT } from "./constants.mjs";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {{ retries?: number, timeoutMs?: number, retryStatuses?: number[] }} [config]
 */
export async function fetchText(url, options = {}, config = {}) {
  const retries = config.retries ?? 3;
  const timeoutMs = config.timeoutMs ?? 60000;
  const retryStatuses = new Set(config.retryStatuses ?? [429, 500, 502, 503, 504]);
  let lastError = new Error(`Request failed: ${url}`);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          ...(options.headers ?? {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (retryStatuses.has(response.status)) {
        throw new Error(`HTTP ${response.status} from ${url}`);
      }

      const body = await response.text();
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} from ${url}: ${body.slice(0, 240)}`);
        error.fatal = true;
        throw error;
      }
      return body;
    } catch (error) {
      if (error && error.fatal) throw error;
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === retries) break;
      const wait = 1500 * 2 ** attempt;
      console.warn(`${lastError.message}. Retrying in ${wait}ms (${attempt + 1}/${retries}).`);
      await sleep(wait);
    }
  }

  throw lastError;
}

export async function fetchJson(url, options, config) {
  const text = await fetchText(url, options, config);
  try {
    return JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON from ${url}: ${message}. Body starts: ${text.slice(0, 180)}`);
  }
}
