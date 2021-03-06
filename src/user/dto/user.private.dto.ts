import { Role } from "../../auth/roles/role.enum";
import { UserEntity } from "../user.entity";

export class UserPrivateDto {
	constructor(userEntity: UserEntity) {
		this.id = userEntity.id!;
		this.username = userEntity.username;
		this.email = userEntity.email;
		this.role = userEntity.role;
		this.createdAt = userEntity.createdAt!;
		this.updatedAt = userEntity.updatedAt;
		this.confirmed = userEntity.confirmed;
	}

	id!: string;

	username?: string;

	email?: string;

	role!: Role;

	confirmed!: boolean;

	createdAt!: string;

	updatedAt?: string;
}
