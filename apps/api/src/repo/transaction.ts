import { Transaction } from "sequelize";
import { DEADLOCK_ATTEMPTS, PG_DEADLOCK_CODE } from "../constant/database";
import newSequelize from "../infra/sequelize";

// Runs fn in one database transaction: commit when it returns, roll back when it throws.
export const withTransaction = async <T>(fn: (transaction: Transaction) => Promise<T>): Promise<T> => {
    const transaction = await newSequelize().transaction();
    try {
        const response = await fn(transaction);
        await transaction.commit();
        return response;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Like withTransaction, but starts again when PostgreSQL cancels it to break a deadlock.
// fn must only change the database, because it can run more than once.
export const withDeadlockRetry = async <T>(fn: (transaction: Transaction) => Promise<T>): Promise<T> => {
    for (let attempt = 1; ; attempt++) {
        try {
            return await withTransaction(fn);
        } catch (error: any) {
            if (error?.parent?.code !== PG_DEADLOCK_CODE || attempt >= DEADLOCK_ATTEMPTS) {
                throw error;
            }
        }
    }
};
