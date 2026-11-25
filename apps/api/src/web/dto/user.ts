import { UserRole } from "../../constant/auth";
import { AuthUser } from "../../service/auth";

export interface UserDto {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    outlet: { id: string; code: string; name: string } | null;
}

export const toUserDto = ({ publicId, email, fullName, role, outlet }: AuthUser): UserDto => ({
    id: publicId,
    email,
    fullName,
    role,
    outlet: outlet ? { id: outlet.publicId, code: outlet.code, name: outlet.name } : null,
});
