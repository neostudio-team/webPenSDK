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
  /**
   * 펜에 대한 버전(정보)를 요청하기 위한 버퍼를 만들고 펜에 전송하는 함수
   * - 펜과 연결 성공 시 가장 먼저 수행하는 작업
   */
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
  /**
   * 펜에 설정된 비밀번호를 변경 요청하기 위한 버퍼를 만들고 펜에 전송하는 함수
   * @param {string} oldPassword 
   * @param {string} newPassword 
   * @returns 
   */
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

  /**
   * 펜에 비밀번호 버퍼를 만들고 전송하는 함수
   * @param {string} password 
   * @returns 
   */
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

  /**
   * 펜에 대한 각종 설정 확인을 요청하기 위한 버퍼를 만들고 전송하는 함수
   * @returns 
   */
  ReqPenStatus() {
    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.SETTING_INFO_REQUEST)
      .PutShort(0)
      .Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  /**
   * 펜에 대한 각종 설정 변경을 요청하기 위한 버퍼를 만들고 전송하는 함수
   * @param {number} stype - SettingType, 변경하고자 하는 설정
   * @param {any} value 
   * @returns 
   */
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

  /**
   * 펜 설정 중 시각을 변경하기 위한 함수 
   * - 1970년 1월 1일부터 millisecond tick (지금은 현재 시각으로 변경)
   * @returns 
   */
  ReqSetupTime() {
    let timetick = Date.now();
    // NLog.log("Setup Time", timetick, new Date(timetick));
    return this.RequestChangeSetting(SettingType.Timestamp, timetick);
  }

  /**
   * 펜 설정 중 자동종료 시간을 변경하기 위한 함수
   * 분 단위 (v2.17 = 5 ~ 3600 // v2.18 = 1 ~ 3600)
   * @param {number} minute 
   * @returns 
   */
  ReqSetupPenAutoShutdownTime(minute: number) {
    return this.RequestChangeSetting(SettingType.AutoPowerOffTime, minute);
  }

  /**
   * 펜 설정 중 펜 뚜껑을 닫을 경우 전원이 꺼지는 기능을 on / off 로 변경하기 위한 함수
   * @param {boolean} enable - on / off
   * @returns 
   */
  ReqSetupPenCapPower(enable: boolean) {
    return this.RequestChangeSetting(SettingType.PenCapOff, enable);
  }

  /**
   * 펜 설정 중 펜 뚜껑 혹은 펜 필기 시 자동으로 전원이 켜지는 기능을 on / off 로 변경하기 위한 함수
   * @param {boolean} enable - on / off
   * @returns 
   */
  ReqSetupPenAutoPowerOn(enable: boolean) {
    return this.RequestChangeSetting(SettingType.AutoPowerOn, enable);
  }

  /**
   * 펜 설정 중 비프음 기능을 on / off 로 변경하기 위한 함수
   * @param {boolean} enable - on / off
   * @returns 
   */
  ReqSetupPenBeep(enable: boolean) {
    return this.RequestChangeSetting(SettingType.Beep, enable);
  }

  /**
   * 펜 설정 중 호버 모드 기능을 on / off 로 변경하기 위한 함수
   * - 호버기능 : 펜의 위치를 penDown 전에 미리 가늠해 볼 수 있도록 시각적인 dot를 표시하는 기능
   * @param {boolean} enable - on / off
   * @returns 
   */
  ReqSetupHoverMode(enable: boolean) {
    return this.RequestChangeSetting(SettingType.Hover, enable);
  }

  /**
   * 펜 설정 중 오프라인 저장 기능을 on / off 로 변경하기 위한 함수
   * @param {boolean} enable - on / off
   * @returns 
   */
  ReqSetupOfflineData(enable: boolean) {
    return this.RequestChangeSetting(SettingType.OfflineData, enable);
  }

  /**
   * 펜 설정 중 펜 LED 색을 변경하기 위한 함수
   * @param {number} color - argb
   * @returns 
   */
  ReqSetupPenColor(color: number) {
    return this.RequestChangeSetting(SettingType.LedColor, color);
  }

  /**
   * 펜 설정 중 펜의 필압 민감도를 변경하기 위한 함수
   * - FSR 필압 센서가 달린 모델에서만 이용
   * @param {number} step - 0 ~ 4 ( 0이 가장 민감 )
   * @returns 
   */
  ReqSetupPenSensitivity(step: number) {
    return this.RequestChangeSetting(SettingType.Sensitivity, step);
  }

  /**
   * 펜 설정 중 USB 모드 설정을 변경하기 위한 함수
   * @param {number} mode - 0 or 1
   * @returns 
   */
  ReqSetupUsbMode(mode: number) {
    return this.RequestChangeSetting(SettingType.UsbMode, mode);
  }

  /**
   * 펜 설정 중 다운 샘플링 기능을 on / off 로 변경하기 위한 함수
   * @param {boolean} enable - on / off
   * @returns 
   */
  ReqSetupDownSampling(enable: boolean) {
    return this.RequestChangeSetting(SettingType.DownSampling, enable);
  }

  /**
   * 펜 설정 중 블루투스 로컬 네임을 변경하기 위한 함수
   * @param {string} btLocalName 
   * @returns 
   */
  ReqSetupBtLocalName(btLocalName: string) {
    return this.RequestChangeSetting(SettingType.BtLocalName, btLocalName);
  }

  /**
   * 펜 설정 중 펜의 필압 민감도를 변경하기 위한 함수
   * - FSC 필압 센서가 달린 모델에서만 이용
   * @param {number} step - 0 ~ 4 ( 0이 가장 민감 )
   * @returns 
   */
  ReqSetupPenFscSensitivity(step: number) {
    return this.RequestChangeSetting(SettingType.FscSensitivity, step);
  }

  /**
   * 펜 설정 중 펜의 데이터 전송 방식을 변경하기 위한 함수
   * - 현재 사용하지 않음
   * @param {number} type - 0 or 1
   * @returns 
   */
  ReqSetupDataTransmissionType(type: number) {
    return this.RequestChangeSetting(SettingType.DataTransmissionType, type);
  }

  /**
   * 펜 설정 중 펜의 비프음과 LED를 변경하기 위한 함수
   * F90 펜 전용
   * @returns 
   */
  ReqBeepAndLight() {
    return this.RequestChangeSetting(SettingType.BeepAndLight, null);
  }

  /**
   * 현재 지원 가능한 펜인지 버전을 비교해 확인하는 함수
   * @returns 
   */
  IsSupportPenProfile() {
    let temp = this.state.VersionInfo.ProtocolVersion.split(".");
    let tempVer = "";
    if (temp.length === 1) tempVer += temp[0];
    else if (temp.length >= 2) tempVer += temp[0] + "." + temp[1];

    let ver = parseFloat(tempVer);

    return ver >= this.defaultConfig.PEN_PROFILE_SUPPORT_PROTOCOL_VERSION;
  }

  /**
   * 펜의 실시간 필기 데이터에 대한 전송을 요청하기 위한 버퍼를 만들고 전송하는 함수
   * @param {array} sectionIds
   * @param {array} ownerIds
   * @param {(array | null)} noteIds - null일 경우 노트를 구분하지 않는다.
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
  /**
   * 펜에 저장된 오프라인 필기 데이터의 종이 정보(note)를 요청하기 위한 버퍼를 만들고 전송하는 함수
   * - section, owner 모두 0일 경우 저장된 모든 note ID 리스트 (최대 64개)를 요청한다.
   * @param {number} section
   * @param {number} owner 
   * @returns 
   */
  ReqOfflineNoteList(section:number = 0, owner:number = 0) {
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

  /**
   * 펜에 저장된 오프라인 필기 데이터의 종이 정보(page)를 요청하기 위한 버퍼를 만들고 전송하는 함수
   * - section, owner, note 와 일치하는 하나의 노트의 page ID 리스트 (최대 128개)를 요청한다.
   * @param {number} section 
   * @param {number} owner 
   * @param {number} note 
   * @returns 
   */
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

  /**
   * 펜에 저장된 오프라인 필기 데이터를 한 note ID 혹은 다수의 page ID로 요청하기 위한 버퍼를 만들고 전송하는 함수
   * @param {number} section 
   * @param {number} owner 
   * @param {number} note 
   * @param {boolean} deleteOnFinished - true일 경우 전송한 데이터 삭제, false일 경우 전송한 데이터 삭제 안함
   * @param {array} pages - 빈 배열일 경우 노트 내 모든 page를 요청
   * @returns 
   */
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

  /**
   * 펜에 저장된 오프라인 필기 데이터에 대한 삭제를 요청하기 위한 버퍼를 만들고 전송하는 함수
   * - 노트 단위 삭제, 최대 64개
   * @param {number} section 
   * @param {number} owner 
   * @param {array} notes 
   * @returns 
   */
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
    console.log("TODO: firmware Update")//
  }

  SuspendSwUpgrade() {
    console.log("TODO: firmware SuspendSwUpgrade")//
  }

  OnDisconnected(){
    console.log("TODO: Disconnect ")//

  }

  // MARK: Util
  /**
   * 만들어진 버퍼(펜에 요청을 위한 버퍼)를 펜 콘트롤러의 handleWrite로 전달하는 함수
   * - 해당 함수가 기능하기 위해서는 handleWrite를 구현해야 한다.
   * @param {ByteUtil} bf 
   * @returns 
   */
  Send(bf: ByteUtil) {
    const u8 = bf.ToU8Array()
    this.penController.handleWrite!(u8);
    return true;
  }
  
}