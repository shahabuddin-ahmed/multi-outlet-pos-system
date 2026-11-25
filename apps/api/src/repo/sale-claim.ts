import { QueryTypes, Transaction } from "sequelize";
import newSequelize from "../infra/sequelize";

export interface ClaimKey {
    outletId: number;
    idempotencyKey: string;
}

export interface Claim {
    requestHash: string;
    userId: number;
    saleId: number;
}

export interface SaleClaimRepoInterface {
    claim(key: ClaimKey, claim: Omit<Claim, "saleId">, transaction: Transaction): Promise<boolean>;
    find(key: ClaimKey, transaction: Transaction): Promise<Claim | null>;
    attachSale(key: ClaimKey, saleId: number, transaction: Transaction): Promise<void>;
}

export class SaleClaimRepo implements SaleClaimRepoInterface {
    // True when this request owns the key. While another request holds the same key and has not finished,
    // this statement waits: it then gets nothing if that one committed, or the key if it rolled back.
    public async claim(
        key: ClaimKey,
        { requestHash, userId }: Omit<Claim, "saleId">,
        transaction: Transaction
    ): Promise<boolean> {
        const inserted = await newSequelize().query(
            `INSERT INTO sale_idempotency (outlet_id, idempotency_key, request_hash, user_id)
             VALUES (:outletId, :idempotencyKey, :requestHash, :userId)
             ON CONFLICT (outlet_id, idempotency_key) DO NOTHING
             RETURNING outlet_id`,
            { replacements: { ...key, requestHash, userId }, type: QueryTypes.SELECT, transaction }
        );
        return inserted.length > 0;
    }

    public async find(key: ClaimKey, transaction: Transaction): Promise<Claim | null> {
        const rows = await newSequelize().query<Claim>(
            `SELECT request_hash AS "requestHash", user_id AS "userId", sale_id AS "saleId"
             FROM sale_idempotency
             WHERE outlet_id = :outletId AND idempotency_key = :idempotencyKey`,
            { replacements: { ...key }, type: QueryTypes.SELECT, transaction }
        );
        return rows[0] ?? null;
    }

    public async attachSale(key: ClaimKey, saleId: number, transaction: Transaction): Promise<void> {
        await newSequelize().query(
            `UPDATE sale_idempotency SET sale_id = :saleId
             WHERE outlet_id = :outletId AND idempotency_key = :idempotencyKey`,
            { replacements: { ...key, saleId }, transaction }
        );
    }
}

export const newSaleClaimRepo = async (): Promise<SaleClaimRepoInterface> => {
    return new SaleClaimRepo();
};
