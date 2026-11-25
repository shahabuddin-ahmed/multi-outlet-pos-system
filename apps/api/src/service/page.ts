// Every list of the API is paged the same way
export interface ListQuery {
    search?: string;
    offset: number;
    limit: number;
}

// What a repository returns for one page
export interface Rows<T> {
    rows: T[];
    total: number;
}

export interface Page<T> {
    data: T[];
    offset: number;
    limit: number;
    total: number;
}

export const toPage = <T>({ rows, total }: Rows<T>, { offset, limit }: ListQuery): Page<T> => ({
    data: rows,
    offset,
    limit,
    total,
});
