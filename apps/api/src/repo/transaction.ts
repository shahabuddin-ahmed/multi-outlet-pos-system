import { Transaction } from "sequelize";
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
