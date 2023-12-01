import ByteUtil, { GetSectionOwnerByte } from "../Util/ByteUtil";
import * as Converter from "../Util/Converter";
import * as NLog from "../Util/NLog";
import CMD from "./CMD";
import CONST from "./Const";
import zlib from "zlib";

import { FirmwareStatusType, ProfileType, SettingType } from "../API/PenMessageType";
import { PenController } from "..";

type DefaultConfig = {
  SupportedProtocolVersion: string;
  PEN_PROFILE_SUPPORT_PROTOCOL_VERSION: number;
  DEFAULT_PASSWORD: string;
};

export default class PenRequestV2 {
  penController: PenController;
  defaultConfig: DefaultConfig;
  state: any;

  constructor(penController: PenController) {
    this.penController = penController;
    this.defaultConfig = Object.freeze({
      SupportedProtocolVersion: "2.18",
      PEN_PROFILE_SUPPORT_PROTOCOL_VERSION: 2.18,
      DEFAULT_PASSWORD: "0000",
    });

    this.state = {
      isFwCompress: false,
      fwPacketSize: 0,
      fwFile: null,
    };
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
    if (!oldPassword) return false;
    NLog.log("ReqSetUpPassword", oldPassword, newPassword);
    // if (oldPassword === this.defaultConfig.DEFAULT_PASSWORD) return false;
    if (newPassword === this.defaultConfig.DEFAULT_PASSWORD) return false;

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
    bf.Put(CONST.PK_STX, false).Put(CMD.PASSWORD_REQUEST).PutShort(16).PutArray(bStrByte, 16).Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  /**
   * 펜에 대한 각종 설정 확인을 요청하기 위한 버퍼를 만들고 전송하는 함수
   * @returns
   */
  ReqPenStatus() {
    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false).Put(CMD.SETTING_INFO_REQUEST).PutShort(0).Put(CONST.PK_ETX, false);

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
      case SettingType.TimeStamp:
        bf.PutShort(9).Put(stype).PutLong(value);
        break;

      case SettingType.AutoPowerOffTime:
        bf.PutShort(3).Put(stype).PutShort(value);
        break;

      case SettingType.LedColor:
        let b = Converter.intToByteArray(value);
        let nBytes = new Uint8Array([b[3], b[2], b[1], b[0]]);
        bf.PutShort(5).Put(stype).PutArray(nBytes, 4);

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
        bf.PutShort(2).Put(stype).Put(value);
        break;
      case SettingType.UsbMode:
        bf.PutShort(2).Put(stype).Put(value);
        break;
      case SettingType.BtLocalName:
        let StrByte = Converter.toUTF8Array(value);
        bf.PutShort(18).Put(stype).Put(16).PutArray(StrByte, 16);
        break;
      case SettingType.FscSensitivity:
        bf.PutShort(2).Put(stype).PutShort(value);
        break;
      case SettingType.DataTransmissionType:
        bf.PutShort(2).Put(stype).Put(value);
        break;
      case SettingType.BeepAndLight:
        bf.PutShort(2).Put(stype).Put(0x00);
        break;
      case SettingType.InitDisk:
        bf.PutShort(5).Put(stype).PutInt(0x4f1c0b42);
        break;
      default:
        NLog.log("undefined setting type");
    }

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("RequestChangeSetting", bf)
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
    return this.RequestChangeSetting(SettingType.TimeStamp, timetick);
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
   * 펜 설정 중 펜의 디스크를 초기화하기 위한 함수
   * @returns
   */
  ReqInitPenDisk() {
    return this.RequestChangeSetting(SettingType.InitDisk, null);
  }

  /**
   * 현재 지원 가능한 펜인지 버전을 비교해 확인하는 함수
   * @returns
   */
  IsSupportPenProfile() {
    let temp = this.penController.mParserV2.penVersionInfo.ProtocolVersion.split(".");
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
  ReqAddUsingNotes(sectionIds: number[], ownerIds: number[], noteIds: number[] | null) {
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
      bf.PutShort(2).Put(0xff).Put(0xff);
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
  ReqOfflineNoteList(section: number = 0, owner: number = 0) {
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
  ReqOfflineData(section: number, owner: number, note: number, deleteOnFinished = true, pages: number[] = []) {
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
      pages.forEach((page: number) => {
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

    bf.PutShort(length).PutArray(GetSectionOwnerByte(section, owner), 4).Put(notes.length);

    notes.forEach((noteId) => {
      bf.PutInt(noteId);
    });

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("ReqOfflineDelete", bf);
    return this.Send(bf);
  }

  /**
   * 펜에 설치된 펌웨어를 업그레이드하기 위해 펜에게 질의하기 위한 버퍼를 만들고 전송하는 함수
   * @param {File} file
   * @param {string} version
   * @param {boolean} isCompressed
   * @returns
   */
  async ReqPenSwUpgrade(file: File, version: string, isCompressed: boolean) {
    const bf = new ByteUtil();

    const deviceName = this.penController.info.DeviceName;

    const fwdeviceName = Converter.toUTF8Array(deviceName);
    const fwVersion = Converter.toUTF8Array(version);

    const fileSize = file.size;

    const fwBf = new ByteUtil();

    const fwBuf = (await this.ReadFileAsync(file)) as ArrayBuffer;
    const fwBufView = new Uint8Array(fwBuf);
    fwBf.PutArray(fwBufView, fwBufView.length);

    let packetSize = 256;
    if (
      deviceName === "NSP-D100" ||
      deviceName === "NSP-D101" ||
      deviceName === "NSP-C200" ||
      deviceName === "NWP-F121" ||
      deviceName === "NWP-F121C"
    ) {
      packetSize = 64;
    }

    let isCompress = 0;
    if (isCompressed) {
      if (
        deviceName === "NEP-E100" ||
        deviceName === "NEP-E101" ||
        deviceName === "NSP-D100" ||
        deviceName === "NSP-D101" ||
        deviceName === "NSP-C200" ||
        deviceName === "NPP-P201"
      ) {
        isCompress = 0;
      } else {
        isCompress = 1;
      }
    }
    this.state.isFwCompress = !!isCompress;
    this.state.fwPacketSize = packetSize;
    this.state.fwFile = fwBf;

    bf.Put(CONST.PK_STX, false).Put(CMD.FIRMWARE_UPLOAD_REQUEST);

    bf.PutShort(42)
      .PutArray(fwdeviceName, 16)
      .PutArray(fwVersion, 16)
      .PutInt(fileSize)
      .PutInt(packetSize)
      .Put(isCompress) //패킷 압축 여부, 1이면 압축, 0이면 압축 X, response로 4가 뜰 경우, 압축지원하지않음.
      .Put(fwBf.GetCheckSumBF()); //압축 안된 파일의 전체 checkSum

    bf.Put(CONST.PK_ETX, false);
    NLog.log("ReqPenSwUpgrade", bf);
    return this.Send(bf);
  }

  /**
   * 펜에서 승인한 펌웨어 업그레이드에 따라 알맞는 펌웨어 데이터를 업로드 하기 위한 버퍼를 만들고 전송하는 함수
   * @param {number} offset
   * @param {Uint8Array} data
   * @param {number} status
   * @returns
   */
  async ReqPenSwUpload(offset: number, data: Uint8Array, status: number) {
    const bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false).Put(CMD.FIRMWARE_PACKET_RESPONSE);

    if (status === FirmwareStatusType.STATUS_ERROR) {
      bf.Put(1);
    } else {
      const beforeCompressSize = data.length;
      let afterCompressSize = 0;
      let compressData: any;

      if (this.state.isFwCompress) {
        compressData = await this.Compress(data);
        afterCompressSize = compressData.length;
      } else {
        compressData = data;
        afterCompressSize = 0;
      }

      bf.Put(0) //ErrorCode ( 0 = 정상 )
        .PutShort(14 + compressData.length)
        .Put(0) //전송여부 0 : 1            //STATUS_END 이면 1로 바꾸는 것이 좋을까?
        .PutInt(offset)
        .Put(bf.GetCheckSumData(data))
        .PutInt(beforeCompressSize)
        .PutInt(afterCompressSize)
        .PutArray(compressData, compressData.length); //파일
    }

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("ReqPenSwUpload", bf);
    return this.Send(bf);
  }

  /**
   * 펜에 프로파일 생성을 요청하기 위한 버퍼를 만들고 전송하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @param {string} password
   * @returns
   */
  ReqProfileCreate = (name: string, password: string) => {
    const bf = new ByteUtil();

    const profileName = Converter.toUTF8Array(name);
    const profilePassword = Converter.toUTF8Array(password);

    //프로파일 고정값
    const neoStudioProfileName = "neonote2";
    const neoStudioProfilePassword = [0xd3, 0x69, 0xde, 0xcd, 0xb6, 0xa, 0x96, 0x1f];
    const neoNoteProfileName = "neolab";
    const neoNoteProfilePassword = [0x6b, 0xca, 0x6b, 0x50, 0x5d, 0xec, 0xa7, 0x8c];
    const nameNeo = Converter.toUTF8Array(neoNoteProfileName);
    const passwordNeo = new Uint8Array(neoNoteProfilePassword);

    bf.Put(CONST.PK_STX, false).Put(CMD.PEN_PROFILE_REQUEST);

    bf.PutShort(21)
      .PutArray(nameNeo, 8)
      .Put(ProfileType.CreateProfile)
      .PutArray(passwordNeo, 8)
      .PutShort(Math.pow(2, 5)) //sector 크기
      .PutShort(Math.pow(2, 7)); //sector 개수

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("ReqProfileCreate", bf);
    return this.Send(bf);
  };

  /**
   * 펜에 설정된 프로파일 제거를 요청하기 위한 버퍼를 만들고 전송하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @param {string} password
   * @returns
   */
  ReqProfileDelete = (name: string, password: string) => {
    const bf = new ByteUtil();

    const profileName = Converter.toUTF8Array(name);
    const profilePassword = Converter.toUTF8Array(password);

    //프로파일 고정값
    const neoStudioProfileName = "neonote2";
    const neoStudioProfilePassword = [0xd3, 0x69, 0xde, 0xcd, 0xb6, 0xa, 0x96, 0x1f];
    const neoNoteProfileName = "neolab";
    const neoNoteProfilePassword = [0x6b, 0xca, 0x6b, 0x50, 0x5d, 0xec, 0xa7, 0x8c];
    const nameNeo = Converter.toUTF8Array(neoNoteProfileName);
    const passwordNeo = new Uint8Array(neoNoteProfilePassword);

    bf.Put(CONST.PK_STX, false).Put(CMD.PEN_PROFILE_REQUEST);

    bf.PutShort(17).PutArray(nameNeo, 8).Put(ProfileType.DeleteProfile).PutArray(passwordNeo, 8);

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("ReqProfileDelete", bf);
    return this.Send(bf);
  };

  /**
   * 펜에 설정된 프로파일 정보를 요청하기 위한 버퍼를 만들고 전송하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @returns
   */
  ReqProfileInfo = (name: string) => {
    const bf = new ByteUtil();

    const profileName = Converter.toUTF8Array(name);

    //프로파일 고정값
    const neoStudioProfileName = "neonote2";
    const neoStudioProfilePassword = [0xd3, 0x69, 0xde, 0xcd, 0xb6, 0xa, 0x96, 0x1f];
    const neoNoteProfileName = "neolab";
    const neoNoteProfilePassword = [0x6b, 0xca, 0x6b, 0x50, 0x5d, 0xec, 0xa7, 0x8c];
    const nameNeo = Converter.toUTF8Array(neoNoteProfileName);
    const passwordNeo = new Uint8Array(neoNoteProfilePassword);

    bf.Put(CONST.PK_STX, false).Put(CMD.PEN_PROFILE_REQUEST);

    bf.PutShort(9).PutArray(nameNeo, 8).Put(ProfileType.InfoProfile);

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("ReqProfileInfo", bf);
    return this.Send(bf);
  };

  /**
   * 펜에 설정된 프로파일 내 데이터 작성을 요청하기 위한 버퍼를 만들고 전송하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @param {string} password
   * @param {Array} keys
   * @param {Array} data
   * @returns
   */
  ReqProfileWriteValue = (name: string, password: string, data: { [key: string]: any }) => {
    // this.ReqProfileWriteValue("test","test",{"test": 123})

    const keyArray = [];
    const dataArray = [];
    for (const key in data) {
      const keyValue = Converter.toUTF8Array(key);
      keyArray.push(keyValue);
      const dataValue = Converter.toUTF8Array(data[key]);
      dataArray.push(dataValue);
    }

    const bf = new ByteUtil();

    let dataLength = 0;
    for (let i = 0; i < dataArray.length; i++) {
      dataLength += 16;
      dataLength += 2;
      dataLength += dataArray[i].length;
    }

    const length = 18 + dataLength;

    const profileName = Converter.toUTF8Array(name);
    const profilePassword = Converter.toUTF8Array(password);

    //프로파일 고정값
    const neoStudioProfileName = "neonote2";
    const neoStudioProfilePassword = [0xd3, 0x69, 0xde, 0xcd, 0xb6, 0xa, 0x96, 0x1f];
    const neoNoteProfileName = "neolab";
    const neoNoteProfilePassword = [0x6b, 0xca, 0x6b, 0x50, 0x5d, 0xec, 0xa7, 0x8c];
    const nameNeo = Converter.toUTF8Array(neoNoteProfileName);
    const passwordNeo = new Uint8Array(neoNoteProfilePassword);

    bf.Put(CONST.PK_STX, false).Put(CMD.PEN_PROFILE_REQUEST);

    bf.PutShort(length)
      .PutArray(nameNeo, 8)
      .Put(ProfileType.WriteProfileValue)
      .PutArray(passwordNeo, 8)
      .Put(dataArray.length);

    for (let i = 0; i < keyArray.length; i++) {
      bf.PutArray(keyArray[i], 16).PutShort(dataArray[i].length).PutArray(dataArray[i], dataArray[i].length);
    }

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("ReqProfileWriteValue", bf);
    return this.Send(bf);
  };

  /**
   * 펜에 설정된 프로파일 내 데이터 정보를 요청하기 위한 버퍼를 만들고 전송하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @param {Array} keys
   * @returns
   */
  ReqProfileReadValue = (name: string, keys: string[]) => {
    const bf = new ByteUtil();
    const length = 10 + keys.length * 16;

    const profileName = Converter.toUTF8Array(name);

    //프로파일 고정값
    const neoStudioProfileName = "neonote2";
    const neoStudioProfilePassword = [0xd3, 0x69, 0xde, 0xcd, 0xb6, 0xa, 0x96, 0x1f];
    const neoNoteProfileName = "neolab";
    const neoNoteProfilePassword = [0x6b, 0xca, 0x6b, 0x50, 0x5d, 0xec, 0xa7, 0x8c];
    const nameNeo = Converter.toUTF8Array(neoNoteProfileName);
    const passwordNeo = new Uint8Array(neoNoteProfilePassword);

    bf.Put(CONST.PK_STX, false).Put(CMD.PEN_PROFILE_REQUEST);

    bf.PutShort(length).PutArray(nameNeo, 8).Put(ProfileType.ReadProfileValue).Put(keys.length);

    for (let i = 0; i < keys.length; i++) {
      const keyValue = Converter.toUTF8Array(keys[i]);
      bf.PutArray(keyValue, 16);
    }

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("ReqProfileReadValue", bf);
    return this.Send(bf);
  };

  /**
   * 펜에 설정된 프로파일 내 데이터 제거를 요청하기 위한 버퍼를 만들고 전송하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @param {string} password
   * @param {Array} keys
   * @returns
   */
  ReqProfileDeleteValue = (name: string, password: string, keys: string[]) => {
    const bf = new ByteUtil();
    const length = 18 + keys.length * 16;

    const profileName = Converter.toUTF8Array(name);
    const profilePassword = Converter.toUTF8Array(password);

    //프로파일 고정값
    const neoStudioProfileName = "neonote2";
    const neoStudioProfilePassword = [0xd3, 0x69, 0xde, 0xcd, 0xb6, 0xa, 0x96, 0x1f];
    const neoNoteProfileName = "neolab";
    const neoNoteProfilePassword = [0x6b, 0xca, 0x6b, 0x50, 0x5d, 0xec, 0xa7, 0x8c];
    const nameNeo = Converter.toUTF8Array(neoNoteProfileName);
    const passwordNeo = new Uint8Array(neoNoteProfilePassword);

    bf.Put(CONST.PK_STX, false).Put(CMD.PEN_PROFILE_REQUEST);

    bf.PutShort(length)
      .PutArray(nameNeo, 8)
      .Put(ProfileType.DeleteProfileValue)
      .PutArray(passwordNeo, 8)
      .Put(keys.length);

    for (let i = 0; i < keys.length; i++) {
      const keyValue = Converter.toUTF8Array(keys[i]);
      bf.PutArray(keyValue, 16);
    }

    bf.Put(CONST.PK_ETX, false);
    // NLog.log("ReqProfileDeleteValue", bf);
    return this.Send(bf);
  };

  OnDisconnected() {
    // console.log("TODO: Disconnect ")//
  }

  /**
   * 데이터를 zlib으로 압축하는 함수
   * @param {Uint8Array} data
   * @returns
   */
  Compress = async (data: Uint8Array) => {
    const input = new Uint8Array(data);
    let compressData = new Uint8Array();

    return new Promise((resolve, reject) => {
      zlib.deflate(input, { level: 9 }, async (err, res) => {
        if (!err) {
          const zipU8 = new Uint8Array(res);
          compressData = zipU8;
          resolve(compressData);
        } else {
          NLog.log("zip error", err);
          reject(err);
        }
      });
    });
  };

  /**
   * 펌웨어 업데이트 파일 등을 읽을 때 비동기처리를 위한 함수
   * @param file
   * @returns
   */
  ReadFileAsync = async (file: File) => {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = reject;

      reader.readAsArrayBuffer(file);
    });
  };

  // MARK: Util
  /**
   * 만들어진 버퍼(펜에 요청을 위한 버퍼)를 펜 콘트롤러의 handleWrite로 전달하는 함수
   * - 해당 함수가 기능하기 위해서는 handleWrite를 구현해야 한다.
   * @param {ByteUtil} bf
   * @returns
   */
  Send(bf: ByteUtil) {
    const u8 = bf.ToU8Array();
    this.penController.handleWrite!(u8);
    return true;
  }
}
