import PenClientParserV2 from "./PenClientParserV2";
import * as Error from "../Model/SDKError";
import OfflineDataInfo from "../Model/OfflineDataInfo";
import PenMessageType from "../API/PenMessageType";

export default class PenController {
  constructor() {
    // this._triggers = {};
    this.mClientV2 = new PenClientParserV2(this);
    this.onDot = null;
    this.onMessage = null;
    this.Protocol = 2;
    this.handleWrite = null;
  }

  //Step1 Add callback
  addCallback(handledot, handlemessage) {
    this.onDot = handledot;
    this.onMessage = handlemessage;
  }

  //Step2 Add Write Pipe
  addWrite(handlewrite) {
    this.handleWrite = handlewrite;
  }

  /** 
  * Step3 Sand Data from Pen
  * @param {array} buff - uint8array
  */
  putData(buff) {
    if (this.Protocol === 1) {
      // this.mClientV1.ProtocolParse(buff, buff.Length);
    } else {
      this.mClientV2.ProtocolParse(buff);
    }
  }

  // Error process
  onErrorDetected(args) {
    this.onMessage(PenMessageType.EVENT_DOT_ERROR, args);
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

  Request(requestV1, requestV2) {
    // if ( PenClient === null || !PenClient.Alive || Protocol === -1 ) {
    if (this.Protocol === -1) {
      throw Error.SDKError("RequestIsUnreached");
    }

    if (this.Protocol === 1) {
      if (!requestV1) throw Error.SDKError("UnaavailableRequest");
      return requestV1();
    } else {
      if (!requestV2) throw Error.SDKError("UnaavailableRequest");
      return requestV2();
    }
  }

  // Request
  SetPassword(oldone, newone = "") {
    this.Request(
      () => {},
      () => {
        this.mClientV2.ReqSetUpPassword(oldone, newone);
      }
    );
  }

  InputPassword(password) {
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

  SetRtcTime(timetick) {
    this.Request(null, () => this.mClientV2.ReqSetupTime(timetick));
  }

  SetAutoPowerOffTime(minute) {
    this.Request(
      () => this.mClientV1.ReqSetupPenAutoShutdownTime(minute),
      () => this.mClientV2.ReqSetupPenAutoShutdownTime(minute)
    );
  }

  SetPenCapPowerOnOffEnable(enable) {
    this.Request(null, () => this.mClientV2.ReqSetupPenCapPower(enable));
  }

  SetAutoPowerOnEnable(enable) {
    this.Request(
      () => this.mClientV1.ReqSetupPenAutoPowerOn(enable),
      () => this.mClientV2.ReqSetupPenAutoPowerOn(enable)
    );
  }

  SetBeepSoundEnable(enable) {
    this.Request(
      () => this.mClientV1.ReqSetupPenBeep(enable),
      () => this.mClientV2.ReqSetupPenBeep(enable)
    );
  }

  SetHoverEnable(enable) {
    this.Request(
      () => this.mClientV1.ReqPenStatus(),
      () => this.mClientV2.ReqPenStatus()
    );
  }

  SetOfflineDataEnable(enable) {
    this.Request(null, () => this.mClientV2.ReqSetupOfflineData(enable));
  }

  SetColor(color) {
    this.Request(
      () => this.mClientV1.ReqSetupPenColor(color),
      () => this.mClientV2.ReqSetupPenColor(color)
    );
  }

  SetSensitivity(step) {
    this.Request(
      () => this.mClientV1.ReqSetupPenSensitivity(step),
      () => this.mClientV2.ReqSetupPenSensitivity(step)
    );
  }

  RequestAvailableNotes(section, owner, notes) {
    this.Request(
      () => this.mClientV1.ReqAddUsingNotes(section, owner, notes),
      () => this.mClientV2.ReqAddUsingNotes(section, owner, notes)
    );
  }

  RequestOfflineDataList() {
    this.Request(
      () => this.mClientV1.ReqOfflineDataList(),
      () => this.mClientV2.ReqOfflineDataList()
    );
  }

  RequestOfflineData(
    section,
    owner,
    note,
    deleteOnFinished = true,
    pages = null
  ) {
    return this.Request(
      () => {
        return this.mClientV1.ReqOfflineData(
          new OfflineDataInfo(section, owner, note, pages)
        );
      },
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
  RequestOfflineDataSectionOwnerNotes(section, owner, notes) {
    return this.Request(
      () => {
        return this.mClientV1.ReqOfflineData(
          new OfflineDataInfo(section, owner, notes[0])
        );
      },
      () => {
        return this.mClientV2.ReqOfflineData(section, owner, notes[0]);
      }
    );
  }
  RequestOfflineDataSectionOwner(section, owner) {
    this.Request(
      () => this.mClientV1.ReqPenStatus(),
      () => this.mClientV2.ReqPenStatus()
    );
  }
  RequestFirmwareInstallation(file, version = null) {
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

  OnConnected() {
    if (this.Protocol !== 1) {
      this.mClientV2.ReqVersionTask();
    }
  }

  OnDisconnected() {
    if (this.Protocol === 1) this.mClientV1.OnDisconnected();
    else this.mClientV2.OnDisconnected();

    this.onDisconnected();
  }
}
