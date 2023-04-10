import Room from "./Room";

export default class Manager {
  rooms: Room[] = [];

  findRoomUserIn(userId: string) {
    const user = this.rooms.find((room) => room.findUser(userId));
    console.log("[found user]", user);
    return user;
  }

  create(roomId: string) {
    this.rooms.push(new Room(roomId));
  }

  delete(roomId: string) {
    const index = this.rooms.findIndex((room) => room.id === roomId);
    if (index > -1) {
      const delRoom = this.rooms.splice(index, 1);
      console.log("[delete room]", delRoom);
    } else {
      console.log("[delete fail room] not found roomId:", roomId);
    }
  }
}
