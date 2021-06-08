import ByteUtil, {GetSectionOwnerByte} from "../Util/ByteUtil";
import * as Converter from '../Util/Converter'
import * as NLog from '../Util/NLog'
import CMD from "./CMD";
import CONST from "./Const";

import { SettingType} from "../API/PenMessageType";
import { PenController } from "..";

type DefaultConfig = {
  SupportedProtocolVersion: string
  PEN_PROFILE_SUPPORT_PROTOCOL_VERSION: number
  DEFAULT_PASSWORD: string
}

export default class PenRequestV2 {

  penController: PenController
  defaultConfig: DefaultConfig
  state: any

  constructor(penController: PenController) {
    this.penController = penController;
    this.defaultConfig = Object.freeze({
      SupportedProtocolVersion: "2.12",
      PEN_PROFILE_SUPPORT_PROTOCOL_VERSION: 2.1,
      DEFAULT_PASSWORD: "0000"
    });
  }

  //
  // Request
  //
  ReqVersion() {
    let bf = new ByteUtil();

    // TODO 정상적으로 넘어오는지 확인이 필요하다.
    let StrAppVersion = Converter.toUTF8Array("0.0.0.0");
    let StrProtocolVersion = Converter.toUTF8Array(this.defaultConfig.SupportedProtocolVersion);

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.VERSION_REQUEST)
      .PutShort(42)
      .PutNull(16)
      // .Put(0x12)
      .Put(0xf0)
      .Put(0x01)
      .PutArray(StrAppVersion, 16)
      .PutArray(StrProtocolVersion, 8)
      .Put(CONST.PK_ETX, false);

    this.Send(bf);
  }

  // NOTE: SendPen
  ReqVersionTask() {
    // TODO: make thread for try 3times
    setTimeout(() => this.ReqVersion(), 500);
  }

  //
  // Password
  //
  ReqSetUpPassword(oldPassword: string, newPassword = "") {
    if (!oldPassword || !newPassword) return false;
    NLog.log("ReqSetUpPassword", oldPassword, newPassword);
    // if (oldPassword === this.defaultConfig.DEFAULT_PASSWORD) return false;
    if (newPassword === this.defaultConfig.DEFAULT_PASSWORD) return false;

    this.state.newPassword = newPassword;

    let oPassByte = Converter.toUTF8Array(oldPassword);
    let nPassByte = Converter.toUTF8Array(newPassword);

    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.PASSWORD_CHANGE_REQUEST)
      .PutShort(33)
      .Put(newPassword === "" ? 0 : 1)
      .PutArray(oPassByte, 16)
      .PutArray(nPassByte, 16)
      .Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  ReqInputPassword(password: string) {
    if (!password) return false;
    if (password === this.defaultConfig.DEFAULT_PASSWORD) return false;

    let bStrByte = Converter.toUTF8Array(password);

    let bf = new ByteUtil();
    bf.Put(CONST.PK_STX, false)
      .Put(CMD.PASSWORD_REQUEST)
      .PutShort(16)
      .PutArray(bStrByte, 16)
      .Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  ReqPenStatus() {
    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.SETTING_INFO_REQUEST)
      .PutShort(0)
      .Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  RequestChangeSetting(stype: number, value: any) {
    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false).Put(CMD.SETTING_CHANGE_REQUEST);

    switch (stype) {
      case SettingType.Timestamp:
        bf.PutShort(9)
          .Put(stype)
          .PutLong(value);
        break;

      case SettingType.AutoPowerOffTime:
        bf.PutShort(3)
          .Put(stype)
          .PutShort(value);
        break;

      case SettingType.LedColor:
        let b = Converter.intToByteArray(value);
        let nBytes = new Uint8Array([b[3], b[2], b[1], b[0]]);
        bf.PutShort(5)
          .Put(stype)
          .PutArray(nBytes, 4);

        //bf.PutShort(5).Put((byte)stype).PutInt((int)value);
        break;

      case SettingType.PenCapOff:
      case SettingType.AutoPowerOn:
      case SettingType.Beep:
      case SettingType.Hover:
      case SettingType.OfflineData:
      case SettingType.DownSampling:
        bf.PutShort(2)
          .Put(stype)
          .Put(value ? 1 : 0);
        break;
      case SettingType.Sensitivity:
        bf.PutShort(2)
          .Put(stype)
          .Put(value);
        break;
      case SettingType.UsbMode:
        bf.PutShort(2)
          .Put(stype)
          .Put(value);
        break;
      case SettingType.BtLocalName:
        let StrByte = Converter.toUTF8Array(value);
        bf.PutShort(18)
          .Put(stype)
          .Put(16)
          .PutArray(StrByte, 16);
        break;
      case SettingType.FscSensitivity:
        bf.PutShort(2)
          .Put(stype)
          .PutShort(value);
        break;
      case SettingType.DataTransmissionType:
        bf.PutShort(2)
          .Put(stype)
          .Put(value);
        break;
      case SettingType.BeepAndLight:
        bf.PutShort(2)
          .Put(stype)
          .Put(0x00);
        break;
      default:
        NLog.log("undefined setting type");
    }

    bf.Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  ReqSetupTime() {
    let timetick = Date.now();
    // NLog.log("Setup Time", timetick, new Date(timetick));
    return this.RequestChangeSetting(SettingType.Timestamp, timetick);
  }

  ReqSetupPenAutoShutdownTime(minute: number) {
    return this.RequestChangeSetting(SettingType.AutoPowerOffTime, minute);
  }

  ReqSetupPenCapPower(enable: boolean) {
    return this.RequestChangeSetting(SettingType.PenCapOff, enable);
  }

  ReqSetupPenAutoPowerOn(enable: boolean) {
    return this.RequestChangeSetting(SettingType.AutoPowerOn, enable);
  }

  ReqSetupPenBeep(enable: boolean) {
    return this.RequestChangeSetting(SettingType.Beep, enable);
  }

  ReqSetupHoverMode(enable: boolean) {
    return this.RequestChangeSetting(SettingType.Hover, enable);
  }

  ReqSetupOfflineData(enable: boolean) {
    return this.RequestChangeSetting(SettingType.OfflineData, enable);
  }

  ReqSetupPenColor(color: number) {
    return this.RequestChangeSetting(SettingType.LedColor, color);
  }

  ReqSetupPenSensitivity(step: number) {
    return this.RequestChangeSetting(SettingType.Sensitivity, step);
  }

  ReqSetupUsbMode(mode: number) {
    return this.RequestChangeSetting(SettingType.UsbMode, mode);
  }

  ReqSetupDownSampling(enable: boolean) {
    return this.RequestChangeSetting(SettingType.DownSampling, enable);
  }

  ReqSetupBtLocalName(btLocalName: string) {
    return this.RequestChangeSetting(SettingType.BtLocalName, btLocalName);
  }

  ReqSetupPenFscSensitivity(step: number) {
    return this.RequestChangeSetting(SettingType.FscSensitivity, step);
  }

  ReqSetupDataTransmissionType(type: number) {
    return this.RequestChangeSetting(SettingType.DataTransmissionType, type);
  }

  ReqBeepAndLight() {
    return this.RequestChangeSetting(SettingType.BeepAndLight, null);
  }

  IsSupportPenProfile() {
    let temp = this.state.VersionInfo.ProtocolVersion.split(".");
    let tempVer = "";
    if (temp.length === 1) tempVer += temp[0];
    else if (temp.length >= 2) tempVer += temp[0] + "." + temp[1];

    let ver = parseFloat(tempVer);

    return ver >= this.defaultConfig.PEN_PROFILE_SUPPORT_PROTOCOL_VERSION;
  }

  /**
   * Returns the sum of a and b
   * @param {array} sectionIds
   * @param {array} ownerIds
   * @param {array} noteIds
   * @returns {boolean}
   */
  ReqAddUsingNotes(sectionIds: number[] , ownerIds: number[] , noteIds: number[] | null) {
    let bf = new ByteUtil();
    bf.Put(CONST.PK_STX, false).Put(CMD.ONLINE_DATA_REQUEST);

    if (noteIds) {
      let length = 2 + noteIds.length * 8;

      bf.PutShort(length).PutShort(noteIds.length);
      noteIds.forEach((item, index) => {
        bf.PutArray(GetSectionOwnerByte(sectionIds[index], ownerIds[index]), 4).PutInt(item);
      });
    } else if (sectionIds && ownerIds) {
      bf.PutShort(2 + 8 * sectionIds.length).PutShort(sectionIds.length);
      sectionIds.forEach((section, index) => {
        bf.PutArray(GetSectionOwnerByte(section, ownerIds[index]), 4).PutInt(0xffffffff);
      });
    } else {
      bf.PutShort(2)
        .Put(0xff)
        .Put(0xff);
    }

    bf.Put(CONST.PK_ETX, false);
    return this.Send(bf);
  }

  //
  // MARK: Offline Data
  //
  ReqOfflineNoteList(section = 0, owner = 0) {
    let pInfo = new Uint8Array([0xff, 0xff, 0xff, 0xff]);

    if (section > 0 && owner > 0) {
      pInfo = GetSectionOwnerByte(section, owner);
    }

    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.OFFLINE_NOTE_LIST_REQUEST)
      .PutShort(4)
      .PutArray(pInfo, 4)
      .Put(CONST.PK_ETX, false);
    return this.Send(bf);
  }

  ReqOfflinePageList(section: number, owner: number, note: number) {
    // NLog.log("ReqOfflinePageList", section, owner, note)
    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.OFFLINE_PAGE_LIST_REQUEST)
      .PutShort(8)
      .PutArray(GetSectionOwnerByte(section, owner), 4)
      .PutInt(note)
      .Put(CONST.PK_ETX, false);
    // NLog.log("Packet Info", bf)
    return this.Send(bf);
  }

  ReqOfflineData(section: number, owner: number, note: number, deleteOnFinished = true, pages = []) {
    let length = 14 + pages.length * 4;
    let bf = new ByteUtil();
    // NLog.log("ReqOfflineData", length)
    bf.Put(CONST.PK_STX, false)
      .Put(CMD.OFFLINE_DATA_REQUEST)
      .PutShort(length)
      .Put(deleteOnFinished ? 1 : 2)
      .Put(0x01)
      .PutArray(GetSectionOwnerByte(section, owner), 4)
      .PutInt(note)
      .PutInt(pages == null ? 0 : pages.length);

    if (pages.length > 0) {
      pages.forEach(page => {
        bf.PutInt(page);
      });
    }

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("ReqOfflineData", bf);
    return this.Send(bf);
  }

  ReqOfflineDelete(section: number, owner: number, notes: number[]) {
    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false).Put(CMD.OFFLINE_DATA_DELETE_REQUEST);

    let length = 5 + notes.length * 4;

    bf.PutShort(length)
      .PutArray(GetSectionOwnerByte(section, owner), 4)
      .Put(notes.length);

    notes.forEach(noteId => {
      bf.PutInt(noteId);
    });

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("ReqOfflineDelete", bf);
    return this.Send(bf);
  }

  //TODO: Firmware
  ReqPenSwUpgrade(file: any, version: any) {
    console.log("TODO: firmware Update")
  }

  SuspendSwUpgrade() {
    console.log("TODO: firmware SuspendSwUpgrade")
  }

  OnDisconnected(){
    console.log("TODO: Disconnect ")

  }

  // MARK: Util
  Send(bf: ByteUtil) {
    const u8 = bf.ToU8Array()
    this.penController.handleWrite!(u8);
    return true;
  }
  
}