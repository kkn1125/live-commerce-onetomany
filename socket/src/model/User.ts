import { v4 } from "uuid";

export default class User {
  id: string;
  roomId: string;
  nickname: string;
  isVideo: boolean = false;
  isAudio: boolean = false;
  createdAt: number = Date.now();
  updatedAt: number = Date.now();

  constructor(id: string, roomId: string, nickname: string) {
    this.id = id;
    this.roomId = roomId;
    this.nickname = nickname;
  }

  setNickname(nickname: string) {
    this.nickname = nickname;
    this.updatedAt = Date.now();
  }
}
