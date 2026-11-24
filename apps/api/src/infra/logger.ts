import config from "../config/config";
import { NodeEnv } from "../constant/env";

type Fields = Record<string, string | number | boolean | null | undefined>;

// Log only ids, codes, paths and timings: never request bodies, query strings, passwords or tokens.
const write = (level: "info" | "warn" | "error", message: string, fields: Fields = {}): void => {
    if (config.NODE_ENV === NodeEnv.TEST && level === "info") {
        return;
    }
    const line = JSON.stringify({ level, time: new Date().toISOString(), message, ...fields });
    if (level === "error") {
        console.error(line);
    } else {
        console.log(line);
    }
};

export const logger = {
    info: (message: string, fields?: Fields) => write("info", message, fields),
    warn: (message: string, fields?: Fields) => write("warn", message, fields),
    error: (message: string, fields?: Fields) => write("error", message, fields),
};

export default logger;
