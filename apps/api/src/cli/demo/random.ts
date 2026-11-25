// A small seeded random number generator (mulberry32), so the demo data is repeatable
export const newRandom = (seed: number) => {
    let state = seed;
    const next = (): number => {
        state = (state + 0x6d2b79f5) | 0;
        let value = Math.imul(state ^ (state >>> 15), 1 | state);
        value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    // A whole number from min to max, both included
    const between = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
    const pick = <T>(list: T[]): T => list[between(0, list.length - 1)];

    return { next, between, pick };
};

export type Random = ReturnType<typeof newRandom>;
