import User from "./User";

export default class WebRTC {
  webrtc: RTCPeerConnection;
  user?: User;
  stream?: MediaStream;
  isVolumeOn?: boolean;
  isVideoOn?: boolean;
  room: any; // TODO: Room Type 구현

  constructor(config: RTCConfiguration) {
    this.webrtc = new RTCPeerConnection(config);
  }

  setUser(user: User) {
    this.user = user;
  }

  setStream(stream: MediaStream) {
    this.stream = stream;
  }
}
