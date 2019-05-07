import PenClientParserV2 from "./PenClientParserV2";
import * as Error from '../Model/SDKError'
import OfflineDataInfo from '../Model/OfflineDataInfo'
 
export default class PenController {
  constructor() {
    this._triggers = {};
    this.mClientV2 = new PenClientParserV2(this);
    this.Protocol = 2;
    // this.PenClient = null
  }

  on(event, callback) {
    this._triggers[event] = callback;
  }

  triggerhandler(event, params) {
    if (this._triggers[event]) {
      this._triggers[event](this.PenClient, params);
    }
  }

  OnDataReceived(buff) {
    if (this.Protocol === 1) {
      // this.mClientV1.ProtocolParse(buff, buff.Length);
    } else {
      this.mClientV2.ProtocolParse(buff);
    }
  }

  onWrite(args) {
    this.triggerhandler("Write", args);
  }
  // Event
  onConnected(args) {
    this.triggerhandler("Connect", args);
  }
  onDisconnect(args) {
    this.triggerhandler("Disconnect", args);
  }
  onFinishedOfflineDownload(args) {
    this.triggerhandler("OfflineDownloadFinished", args);
  }
  onPenAuthenticated() {
    this.triggerhandler("Authenticated");
  }
  onAvailableNoteAdded() {
    this.triggerhandler("AvailableNoteAdded");
  }
  onPenAutoPowerOnSetupResponse(args) {
    this.triggerhandler("AutoPowerOffTimeChanged", args);
  }
  onPenBeepSetupResponse(args) {
    this.triggerhandler("BeepSoundChanged", args);
  }
  onPenCapPowerOnOffSetupResponse(args) {
    this.triggerhandler("PenCapPowerOnOffChanged", args);
  }
  onPenColorSetupResponse(args) {
    this.triggerhandler("PenColorChanged", args);
  }
  onPenHoverSetupResponse(args) {
    this.triggerhandler("HoverChanged", args);
  }
  onPenOfflineDataSetupResponse(args) {
    this.triggerhandler("OfflineDataChanged", args);
  }
  onPenPasswordRequest(args) {
    this.triggerhandler("PasswordRequested", args);
  }
  onPenPasswordSetupResponse(args) {
    this.triggerhandler("PasswordChanged", args);
  }
  onPenSensitivitySetupResponse(args) {
    this.triggerhandler("SensitivityChanged", args);
  }
  onPenTimestampSetupResponse(args) {
    this.triggerhandler("RtcTimeChanged", args);
  }
  onReceiveBatteryAlarm(args) {
    this.triggerhandler("BatteryAlarmReceived", args);
  }
  onReceiveDot(args) {
    this.triggerhandler("DotReceived", args);
  }
  onReceiveFirmwareUpdateResult(args) {
    this.triggerhandler("FirmwareInstallationFinished", args);
  }
  onStartFirmwareInstallation() {
    this.triggerhandler("FirmwareInstallationStarted");
  }
  onReceiveFirmwareUpdateStatus(args) {
    this.triggerhandler("FirmwareInstallationStatusUpdated", args);
  }
  onReceiveOfflineDataList(args) {
    this.triggerhandler("OfflineDataListReceived", args);
  }
  onReceiveOfflineStrokes(args) {
    this.triggerhandler("OfflineStrokeReceived", args);
  }
  onReceivePenStatus(args) {
    this.triggerhandler("PenStatusReceived", args);
  }
  onRemovedOfflineData(args) {
    this.triggerhandler("OfflineDataRemoved", args);
  }
  onStartOfflineDownload() {
    this.triggerhandler("OfflineDataDownloadStarted");
  }
  onPenProfileReceived(args) {
    this.triggerhandler("PenProfileReceived", args);
  }
  onErrorDetected(args) {
    this.triggerhandler("ErrorDetected", args);
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
  AddAvailableNote() {
    this.Request(
      () => this.mClientV1.ReqAddUsingNote(),
      () => this.mClientV2.ReqAddUsingNote()
    );
  }

  AddAvailableNoteSectionOwnerNotes(section, owner, notes = null) {
    if (arguments.length === 0) {
      this.Request(
        () => this.mClientV1.ReqAddUsingNote(),
        () => this.mClientV2.ReqAddUsingNote()
      );
    } else {
      this.Request(
        () => this.mClientV1.ReqAddUsingNote(section, owner, notes),
        () => this.mClientV2.ReqAddUsingNote(section, owner, notes)
      );
    }
  }

  AddAvailableNotesSectionOwner(section, owner) {
    if (section == null) throw new Error.ArgumentNullException("section");
    if (owner == null) throw new Error.ArgumentNullException("onwer");
    if (section.Length !== owner.Length)
      throw new Error.ArgumentOutOfRangeException(
        "section, owner"
      );

    this.Request(
      () => this.mClientV1.ReqAddUsingNotes(section, owner),
      () => this.mClientV2.ReqAddUsingNotes(section, owner)
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
