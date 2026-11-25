import { OutletInterface } from "../../model/outlet";

// What the client sees. Fields are listed one by one, so a new column is never shown by accident.
export interface OutletDto {
    id: string;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
}

export const toOutletDto = (outlet: OutletInterface): OutletDto => ({
    id: outlet.publicId,
    code: outlet.code,
    name: outlet.name,
    address: outlet.address,
    phone: outlet.phone,
    isActive: outlet.isActive,
    createdAt: outlet.createdAt,
});
