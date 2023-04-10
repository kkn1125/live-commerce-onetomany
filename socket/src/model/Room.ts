import { v4 } from "uuid";
import User from "./User";

export default class Room {
  id: string = v4();
  users: User[];
  length: number = 0;

  constructor(roomId: string) {
    this.id = roomId;
  }

  findUser(userId: string) {
    return this.users.find((u) => u.id === userId);
  }

  in(user: User) {
    console.log("[insert user]", user);
    this.users.push(user);
    this.length += 1;
  }

  out(userId: string) {
    const index = this.users.findIndex((user) => user.id === userId);
    if (index > -1) {
      const delUser = this.users.splice(index, 1);
      console.log("[delete user]", delUser);
    } else {
      console.log("[delete fail user] not found userId:", userId);
    }
  }
}
