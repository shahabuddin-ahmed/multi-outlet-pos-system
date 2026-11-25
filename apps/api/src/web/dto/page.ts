import { Page } from "../../service/page";

export const toPageDto = <T, U>({ data, offset, limit, total }: Page<T>, toDto: (record: T) => U): Page<U> => ({
    data: data.map((record) => toDto(record)),
    offset,
    limit,
    total,
});
