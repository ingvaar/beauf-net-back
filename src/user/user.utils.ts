import { Role } from '../auth/roles/role.enum';

export type RequestWithUser = Request & { user: { id: string; role: Role } };
