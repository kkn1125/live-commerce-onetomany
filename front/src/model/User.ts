export type RoleType = "master" | "viewer";

export default class User {
  connectionId: string;
  role: RoleType;

  constructor(connectionId: string, role: RoleType) {
    this.connectionId = connectionId;
    this.role = role;
  }

  setRole(role: RoleType) {
    this.role = role;
  }
}
