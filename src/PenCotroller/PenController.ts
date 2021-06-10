import PenClientParserV2 from "./PenClientParserV2";
import * as Error from "../Model/SDKError";
import PenMessageType from "../API/PenMessageType";
import PenRequestV2 from "./PenRequestV2"
import Dot from "../API/Dot"

type OnDot = (pencontroller: PenController, dot: Dot) => void
type OnMessage = (pencontroller: PenController, msgType: number, args: any) => void
type HandleWrite = (u8: Uint8Array) => void

export default class PenController {
  mParserV2: PenClientParserV2
  mClientV2: PenRequestV2
  mClientV1: any
  onDot: OnDot | null
  onMessage: OnMessage | null
  handleWrite: HandleWrite | null
  Protocol: number
  info: object

  constructor() {
    this.mParserV2 = new PenClientParserV2(this);
    this.mClientV2 = new PenRequestV2(this)
    this.onDot = null;
    this.onMessage = null;
    this.Protocol = 2;
    this.handleWrite = null;
    this.info = {}
  }

  /**
   *
   *
   * @param {callback} handledot
   * @param {callback} handlemessage
   * @memberof PenController
   */
  addCallback(handledot: OnDot, handlemessage: OnMessage) {
    this.onDot = handledot;
    this.onMessage = handlemessage;
  }

  // MARK: Step2 Add Write Pipe
  addWrite(handlewrite: HandleWrite) {
    this.handleWrite = handlewrite;
  }

  /** 
  * Step3 Sand Data from Pen
  * @param {array} buff - uint8array
  */
  putData(buff: Uint8Array) {
    if (this.Protocol === 1) {
      // this.mClientV1.ProtocolParse(buff, buff.Length);
    } else {
      this.mParserV2.ProtocolParse(buff);
    }
  }

  // Error process
  onErrorDetected(args: any) {
    this.onMessage!(this, PenMessageType.EVENT_DOT_ERROR, args)
  }

  //SDK Local logic
  // step1
  localprocessSetRTCTime() {
    this.SetRtcTime()
  }

  // Step2
  localProcessPenSettingInfo() {
    this.RequestPenStatus()
  }

  Request(requestV1: any, requestV2: any) {
    // if ( PenClient === null || !PenClient.Alive || Protocol === -1 ) {
    if (this.Protocol === -1) {
      throw new Error.SDKError("RequestIsUnreached");
    }

    if (this.Protocol === 1) {
      if (!requestV1) throw new Error.SDKError("UnaavailableRequest");
      return requestV1();
    } else {
      if (!requestV2) throw new Error.SDKError("UnaavailableRequest");
      return requestV2();
    }
  }

  // MARK: Request
  //Request Version Info
  RequestVersionInfo() {
    return this.mParserV2.penVersionInfo
  }

  // Request
  /**
   * @param {*} oldone
   * @param {string} [newone=""]
   * @memberof PenController
   */
  SetPassword(oldone: string, newone = "") {
    this.Request(
      () => {},
      () => {
        this.mClientV2.ReqSetUpPassword(oldone, newone);
      }
    );
  }

  InputPassword(password: string) {
    this.Request(
      () => this.mClientV1.ReqInputPassword(password),
      () => this.mClientV2.ReqInputPassword(password)
    );
  }

  RequestPenStatus() {
    this.Request(
      () => this.mClientV1.ReqPenStatus(),
      () => this.mClientV2.ReqPenStatus()
    );
  }

  SetRtcTime() {
    this.Request(null, () => this.mClientV2.ReqSetupTime());
  }

  SetAutoPowerOffTime(minute: number) {
    this.Request(
      () => this.mClientV1.ReqSetupPenAutoShutdownTime(minute),
      () => this.mClientV2.ReqSetupPenAutoShutdownTime(minute)
    );
  }

  SetPenCapPowerOnOffEnable(enable: boolean) {
    this.Request(null, () => this.mClientV2.ReqSetupPenCapPower(enable));
  }

  SetAutoPowerOnEnable(enable: boolean) {
    this.Request(
      () => this.mClientV1.ReqSetupPenAutoPowerOn(enable),
      () => this.mClientV2.ReqSetupPenAutoPowerOn(enable)
    );
  }

  SetBeepSoundEnable(enable: boolean) {
    this.Request(
      () => this.mClientV1.ReqSetupPenBeep(enable),
      () => this.mClientV2.ReqSetupPenBeep(enable)
    );
  }

  SetHoverEnable(enable: boolean) {
    this.Request(
      () => this.mClientV1.ReqPenStatus(),
      () => this.mClientV2.ReqPenStatus()
    );
  }

  SetOfflineDataEnable(enable: boolean) {
    this.Request(null, () => this.mClientV2.ReqSetupOfflineData(enable));
  }

  SetColor(color: number) {
    this.Request(
      () => this.mClientV1.ReqSetupPenColor(color),
      () => this.mClientV2.ReqSetupPenColor(color)
    );
  }

  SetSensitivity(step: number) {
    this.Request(
      () => this.mClientV1.ReqSetupPenSensitivity(step),
      () => this.mClientV2.ReqSetupPenSensitivity(step)
    );
  }

  RequestAvailableNotes(sections: number[], owners: number[], notes: number[] | null) {
    this.Request(
      () => this.mClientV1.ReqAddUsingNotes(sections, owners, notes),
      () => this.mClientV2.ReqAddUsingNotes(sections, owners, notes)
    );
  }

  // Offline List
  // setion or owner  = null : All Note
  RequestOfflineNoteList(section: number, owner: number) {
    this.Request(
      () => this.mClientV1.ReqOfflineDataList(),
      () => this.mClientV2.ReqOfflineNoteList(section, owner)
    );
  }

  RequestOfflinePageList(section: number, owner: number, note: number) {
    this.Request(
      () => this.mClientV1.ReqOfflineDataList(),
      () => this.mClientV2.ReqOfflinePageList(section, owner, note)
    );
  }

  // Offline Data
  RequestOfflineData(section: number, owner: number, note: number, deleteOnFinished = true, pages = [] ) {
    return this.Request(
      () => this.mClientV1.ReqOfflineData(),
      () => {
        return this.mClientV2.ReqOfflineData(
          section,
          owner,
          note,
          deleteOnFinished,
          pages
        );
      }
    );
  }

  /** Offline Data Delete
  * @param {number} section
  * @param {number} owner
  * @param {array} notes
  */
  RequestOfflineDelete(section: number, owner: number, notes: number[]) {
    this.Request(
      () => this.mClientV1.ReqOfflineDelete( ),
      () => {
        this.mClientV2.ReqOfflineDelete(section, owner, notes);
      }
    );
  }

  // Firmware Update
  RequestFirmwareInstallation(file: any, version = null) {
    this.Request(
      () => this.mClientV1.ReqPenSwUpgrade(file),
      () => {
        this.mClientV2.ReqPenSwUpgrade(file, version);
      }
    );
  }
  SuspendFirmwareInstallation() {
    this.Request(
      () => this.mClientV1.SuspendSwUpgrade(),
      () => this.mClientV2.SuspendSwUpgrade()
    );
  }
  // Skip pen profile

  // Password
  ReqInputPassword(pass: string) {
    this.Request(()=> this.mClientV1.ReqInputPassword(pass), 
    this.mClientV2.ReqInputPassword(pass))
  }

  OnConnected() {
    if (this.Protocol !== 1) {
      this.mParserV2.state.first = true
      this.mClientV2.ReqVersionTask();
    }
  }

  OnDisconnected() {
    if (this.Protocol === 1) this.mClientV1.OnDisconnected();
    else this.mClientV2.OnDisconnected();

    // this.onDisconnected();
  }
}
