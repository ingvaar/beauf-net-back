import { Role } from "../../auth/roles/role.enum";
import { UserEntity } from "../user.entity";

export class UserPublicDto {
	constructor(userEntity: UserEntity) {
		this.id = userEntity.id;
		this.username = userEntity.username;
		this.role = userEntity.role;
		this.confirmed = userEntity.confirmed;
	}

	id?: string;

	username?: string;

	role!: Role;

	confirmed!: boolean;
}
