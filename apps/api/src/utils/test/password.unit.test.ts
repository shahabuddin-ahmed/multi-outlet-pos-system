import { generatePassword, hashPassword, verifyPassword } from "../password";

describe("password", () => {
    it("accepts the right password only", async () => {
        const stored = await hashPassword("correct horse");

        expect(await verifyPassword("correct horse", stored)).toBe(true);
        expect(await verifyPassword("Correct horse", stored)).toBe(false);
    });

    it("salts every hash, so equal passwords look different", async () => {
        expect(await hashPassword("same-password")).not.toBe(await hashPassword("same-password"));
    });

    it("refuses a stored value it does not understand", async () => {
        expect(await verifyPassword("anything", "plain-text")).toBe(false);
    });

    it("generates a long random password", () => {
        expect(generatePassword()).toHaveLength(16);
        expect(generatePassword()).not.toBe(generatePassword());
    });
});
