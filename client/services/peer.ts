
class WebRTCService {
  public _peer: RTCPeerConnection

  constructor() {
    this._peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:global.stun.twilio.com:3478',
          ],
        },
        {
          urls: 'turn:turn.p2pshare.tech:3478',
          username: 'admin',
          credential: 'admin1',
        },
      ],
    })
  }
}

class PeerService {
  private _webRtc: WebRTCService | undefined

  public myDataChanel: RTCDataChannel | undefined
  public remoteDataChanel: RTCDataChannel | undefined
  public remoteSocketId: string | undefined

  public init() {
    if (!this._webRtc) {
      this._webRtc = new WebRTCService()

      this.myDataChanel = this.peer?.createDataChannel(
        `file-transfer-${Date.now()}`
      )
    }

    return this
  }

  public get peer() {
    return this._webRtc?._peer
  }

  public async setRemoteDesc(offer: RTCSessionDescriptionInit) {
    if (!this.peer) return

    await this.peer.setRemoteDescription(
      new RTCSessionDescription(offer)
    )
  }

  public async getAnswer(offer: RTCSessionDescriptionInit) {
    if (!this.peer) return

    await this.peer.setRemoteDescription(
      new RTCSessionDescription(offer)
    )

    const answer = await this.peer.createAnswer()

    await this.peer.setLocalDescription(answer)

    return this.peer.localDescription
  }

  public async getOffer() {
    if (!this.peer) return

    const offer = await this.peer.createOffer()

    await this.peer.setLocalDescription(offer)

    return this.peer.localDescription
  }

  public close() {
    if (this.peer) {
      this.peer.close()
    }

    this._webRtc = undefined
    this.myDataChanel = undefined
    this.remoteDataChanel = undefined
    this.remoteSocketId = undefined
  }
}

export default new PeerService()
