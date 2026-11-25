// SQL for "between these calendar days" in the business time zone. The query gets :from, :to and :timezone
// as replacements. The column is left untouched, so its index can be used.

// A day starts at local midnight
export const onOrAfterDay = (column: string): string =>
    `${column} >= (CAST(:from AS timestamp) AT TIME ZONE :timezone)`;

// The whole last day counts: everything before the following midnight
export const onOrBeforeDay = (column: string): string =>
    `${column} < (CAST(CAST(:to AS date) + 1 AS timestamp) AT TIME ZONE :timezone)`;
