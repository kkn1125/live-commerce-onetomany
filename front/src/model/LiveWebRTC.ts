import { dev } from "../util/tool";
import LiveSocket from "./LiveSocket";
import User from "./User";

type RTCEventType = "icecandidate";
type RTCCallbackType = (candidate: string) => void;

export default class LiveWebRTC {
  pc?: RTCPeerConnection;
  config?: object;
  user?: User;
  localStream?: MediaStream;
  video: HTMLVideoElement = document.createElement("video");
  isVolumeOn?: boolean;
  isVideoOn?: boolean;
  room: any; // TODO: Room Type 구현
  offer?: RTCSessionDescriptionInit | RTCSessionDescription | null;
  answer?: RTCSessionDescriptionInit | RTCSessionDescription | null;
  remoteOffer?: RTCSessionDescriptionInit | RTCSessionDescription | null;
  remoteAnswer?: RTCSessionDescriptionInit | RTCSessionDescription | null;

  constraints: MediaStreamConstraints;

  events: {
    [type in RTCEventType]?: RTCCallbackType;
  } = {};

  on(type: RTCEventType, cb: RTCCallbackType) {
    this.events[type] = cb;
  }

  constructor(config: RTCConfiguration, constraints?: MediaStreamConstraints) {
    this.config = config;
    this.constraints = constraints || {
      video: true,
      audio: false,
    };
  }

  createPeer() {
    dev.log("create rtc");
    const pc = new RTCPeerConnection(this.config);

    pc.onicecandidate = (e) => {
      // console.log("onicecandidate", e);
      dev.debug("on ice candidate");
      if (e.candidate) {
        if (!this.events["icecandidate"])
          this.events["icecandidate"] = () => {};
        // console.log(e.candidate);
        this.events["icecandidate"].call(this, e.candidate.candidate);
      }
      this.offer = (this.pc as RTCPeerConnection).localDescription;
    };

    pc.ontrack = (e) => {
      console.log("ontrack", e);
    };

    this.pc = pc;
  }

  async connectWebCam() {
    this.createVideo();
    this.appendToVideo("#main-video");
    await this.getMedia();
  }

  createVideo() {
    const video = document.createElement("video");
    video.playsInline = true;
    video.autoplay = true;
    this.video = video;
  }

  appendToVideo(id: string) {
    const el = document.querySelector(id);
    el?.insertAdjacentElement("beforeend", this.video as HTMLVideoElement);
  }

  setUser(user: User) {
    this.user = user;
  }

  setStream(stream: MediaStream) {
    this.localStream = stream;
  }

  setRoomId(roomId: string) {}

  /* media settings */
  async getMedia() {
    const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
    this.video.srcObject = this.localStream = stream;
    stream
      .getTracks()
      .forEach((track) =>
        (this.pc as RTCPeerConnection).addTrack(track, stream)
      );
  }

  async createOffer() {
    return new Promise(async (resolve) => {
      const offer = await (this.pc as RTCPeerConnection).createOffer();
      this.offer = offer;
      this.setLocalDescription(offer);
      dev.alias("create offer").log(offer);
      resolve(offer);
    });
  }

  createAnswer() {
    return new Promise(async (resolve) => {
      const answer = await (this.pc as RTCPeerConnection).createAnswer({
        offer: this.offer,
      });
      this.answer = answer;
      this.setLocalDescription(answer);
      resolve(answer);
    });
  }

  getOffer(offer: RTCSessionDescriptionInit) {
    this.offer = offer;
    this.setRemoteDescription(offer);
  }

  getAnswer(answer: RTCSessionDescriptionInit) {
    this.answer = answer;
    this.setRemoteDescription(answer);
  }

  applyAnswer() {
    (this.pc as RTCPeerConnection).setLocalDescription();
  }

  setLocalDescription(session: RTCSessionDescriptionInit) {
    (this.pc as RTCPeerConnection).setLocalDescription(session);
  }
  setRemoteDescription(session: RTCSessionDescriptionInit) {
    (this.pc as RTCPeerConnection).setRemoteDescription(session);
  }
}
