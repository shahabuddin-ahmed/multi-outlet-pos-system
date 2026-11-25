import { UUID_PATTERN } from "../../../../constant/api";

// Every "id" in an answer must be a public UUID: database ids never leave the server
export const expectNoInternalIds = (value: unknown): void => {
    if (Array.isArray(value)) {
        value.forEach(expectNoInternalIds);
        return;
    }
    if (value === null || typeof value !== "object") {
        return;
    }
    for (const [key, child] of Object.entries(value)) {
        expect(key).not.toMatch(/^public_?id$/i);
        if (key === "id" || /(Id|_id)$/.test(key)) {
            expect(child).toEqual(expect.stringMatching(UUID_PATTERN));
        }
        expectNoInternalIds(child);
    }
};
