import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
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
	@AutoMap()
	id?: string;

	@Column({
		unique: true,
	})
	@AutoMap()
	username?: string;

	@Column({
		unique: true,
	})
	@AutoMap()
	email?: string;

	@Column()
	@Exclude({ toPlainOnly: true })
	@AutoMap()
	password?: string;

	@Column()
	@AutoMap()
	role: Role = Role.User;

	@CreateDateColumn({
		name: 'created_at',
		type: 'timestamp',
		nullable: true,
	})
	@AutoMap()
	createdAt?: string;

	@UpdateDateColumn({
		name: 'updated_at',
		type: 'timestamp',
		nullable: true,
	})
	@Expose({ groups: ['private'] })
	@AutoMap()
	updatedAt?: string;
}
