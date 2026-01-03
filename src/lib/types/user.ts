import type { user } from "$/server/db/schema";
import type { Session } from "./session";

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type UserDTO = {
  id: string;
  githubId: number | null;
  name: string;
  email: string;
  emailVerified: boolean;
  registeredTwoFactor: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserTableView = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type UserWithSessions = User & {
  sessions: Session[];
};
export type UserDTOWithSessions = UserDTO & {
  sessions: Session[];
};
