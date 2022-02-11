import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

import { Role } from '../auth/roles/role.enum';

@Entity({ name: 'users' })
export class UserEntity {
	@PrimaryGeneratedColumn('uuid')
	@ApiProperty({
		type: 'ObjectId',
	})
	id?: string;

	@Column({
		unique: true,
	})
	username?: string;

	@Column({
		unique: true,
	})
	email?: string;

	@Column({
		default: 'FALSE',
	})
	confirmed!: boolean;

	@Column()
	password?: string;

	@Column()
	role: Role = Role.User;

	@CreateDateColumn({
		name: 'created_at',
		type: 'timestamp',
		nullable: true,
	})
	createdAt?: string;

	@UpdateDateColumn({
		name: 'updated_at',
		type: 'timestamp',
		nullable: true,
	})
	updatedAt?: string;
}
