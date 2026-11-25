import { randomBytes, scrypt, ScryptOptions, timingSafeEqual } from "crypto";
import { GENERATED_PASSWORD_BYTES, SCRYPT } from "../constant/auth";

// Stored form: scrypt$cost$blockSize$parallelism$salt$key. Keeping the work factors with each hash
// lets them be raised later without breaking old passwords.
const SCHEME = "scrypt";

const derive = (password: string, salt: Buffer, keyBytes: number, options: ScryptOptions): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        scrypt(password, salt, keyBytes, options, (error, key) => (error ? reject(error) : resolve(key)));
    });

const optionsOf = (cost: number, blockSize: number, parallelism: number): ScryptOptions => ({
    N: cost,
    r: blockSize,
    p: parallelism,
    maxmem: SCRYPT.MAX_MEMORY_BYTES,
});

export const hashPassword = async (password: string): Promise<string> => {
    const { COST, BLOCK_SIZE, PARALLELISM, KEY_BYTES, SALT_BYTES } = SCRYPT;
    const salt = randomBytes(SALT_BYTES);
    const key = await derive(password, salt, KEY_BYTES, optionsOf(COST, BLOCK_SIZE, PARALLELISM));
    return [SCHEME, COST, BLOCK_SIZE, PARALLELISM, salt.toString("base64"), key.toString("base64")].join("$");
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
    const [scheme, cost, blockSize, parallelism, salt, key] = stored.split("$");
    if (scheme !== SCHEME || !key) {
        return false;
    }
    const expected = Buffer.from(key, "base64");
    const actual = await derive(
        password,
        Buffer.from(salt, "base64"),
        expected.length,
        optionsOf(Number(cost), Number(blockSize), Number(parallelism))
    );
    // Takes the same time wherever the first difference is
    return timingSafeEqual(actual, expected);
};

export const generatePassword = (): string => randomBytes(GENERATED_PASSWORD_BYTES).toString("base64url");
