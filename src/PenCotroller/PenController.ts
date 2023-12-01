import PenClientParserV2 from "./PenClientParserV2";
import * as Error from "../Model/SDKError";
import PenMessageType from "../API/PenMessageType";
import PenRequestV2 from "./PenRequestV2";
import Dot from "../API/Dot";
import { DotErrorInfo, VersionInfo } from "../Util/type";

type OnDot = (pencontroller: PenController, dot: Dot) => void;
type OnMessage = (pencontroller: PenController, msgType: number, args: any) => void;
type HandleWrite = (u8: Uint8Array) => void;

export default class PenController {
  mParserV2: PenClientParserV2;
  mClientV2: PenRequestV2;
  mClientV1: any;
  onDot: OnDot | null;
  onMessage: OnMessage | null;
  handleWrite: HandleWrite | null;
  Protocol: number;
  info: VersionInfo;
  device: any;

  constructor() {
    this.mParserV2 = new PenClientParserV2(this);
    this.mClientV2 = new PenRequestV2(this);
    this.onDot = null;
    this.onMessage = null;
    this.Protocol = 2;
    this.handleWrite = null;
    this.info = {} as VersionInfo;
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
   * Step3 Send Data from Pen
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
  /**
   * 도트 에러 발생 시 메시지 출력을 위한 함수
   * - 해당 함수가 기능하기 위해서는 onMessage를 구현해야 한다.
   * @param {any} args
   */
  onErrorDetected(args: DotErrorInfo) {
    this.onMessage!(this, PenMessageType.EVENT_DOT_ERROR, args);
  }

  //SDK Local logic
  // step1
  localprocessSetRTCTime() {
    this.SetRtcTime();
  }

  // Step2
  localProcessPenSettingInfo() {
    this.RequestPenStatus();
  }

  /**
   * 프로토콜 버전에 따라 펜에 요청하는 함수를 분기 실행하는 함수
   * @param {any} requestV1
   * @param {any} requestV2
   * @returns
   */
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
  /**
   * 현재 버전을 요청하는 함수
   * @returns
   */
  RequestVersionInfo() {
    return this.mParserV2.penVersionInfo;
  }

  // Request
  /**
   * 펜에 설정된 비밀번호를 변경 요청하는 함수
   * @param {string} oldone
   * @param {string} [newone=""]
   * @memberof PenController
   */
  SetPassword(oldone: string, newone = "") {
    if (newone === this.mClientV2.defaultConfig.DEFAULT_PASSWORD) {
      this.onMessage!(this, PenMessageType.PEN_ILLEGAL_PASSWORD_0000, null);
      return;
    } else {
      this.mParserV2.state.newPassword = newone;
    }
    this.Request(
      () => {},
      () => {
        this.mClientV2.ReqSetUpPassword(oldone, newone);
      }
    );
  }

  /**
   * 펜에 비밀번호를 전송하는 함수
   * @param {string} password
   */
  InputPassword(password: string) {
    this.Request(
      () => this.mClientV1.ReqInputPassword(password),
      () => this.mClientV2.ReqInputPassword(password)
    );
  }

  /**
   * 펜에 대한 각종 설정 확인을 요청하는 함수
   */
  RequestPenStatus() {
    this.Request(
      () => this.mClientV1.ReqPenStatus(),
      () => this.mClientV2.ReqPenStatus()
    );
  }

  /**
   * 펜 설정 중 시각을 변경 요청하는 함수
   * - 1970년 1월 1일부터 millisecond tick (지금은 현재 시각으로 변경)
   */
  SetRtcTime() {
    this.Request(null, () => this.mClientV2.ReqSetupTime());
  }

  /**
   * 펜 설정 중 자동종료 시간을 변경 요청하는 함수
   * 분 단위 (v2.17 = 5 ~ 3600 // v2.18 = 1 ~ 3600)
   * @param {number} minute
   */
  SetAutoPowerOffTime(minute: number) {
    this.Request(
      () => this.mClientV1.ReqSetupPenAutoShutdownTime(minute),
      () => this.mClientV2.ReqSetupPenAutoShutdownTime(minute)
    );
  }

  /**
   * 펜 설정 중 펜 뚜껑을 닫을 경우 전원이 꺼지는 기능을 변경 요청하는 함수
   * @param {boolean} enable - on / off
   */
  SetPenCapPowerOnOffEnable(enable: boolean) {
    this.Request(null, () => this.mClientV2.ReqSetupPenCapPower(enable));
  }

  /**
   * 펜 설정 중 펜 뚜껑 혹은 펜 필기 시 자동으로 전원이 켜지는 기능을 변경 요청하는 함수
   * @param {boolean} enable - on / off
   */
  SetAutoPowerOnEnable(enable: boolean) {
    this.Request(
      () => this.mClientV1.ReqSetupPenAutoPowerOn(enable),
      () => this.mClientV2.ReqSetupPenAutoPowerOn(enable)
    );
  }

  /**
   * 펜 설정 중 비프음 기능을 변경 요청하는 함수
   * @param {boolean} enable - on / off
   */
  SetBeepSoundEnable(enable: boolean) {
    this.Request(
      () => this.mClientV1.ReqSetupPenBeep(enable),
      () => this.mClientV2.ReqSetupPenBeep(enable)
    );
  }

  /**
   * 펜 설정 중 호버 모드 기능을 변경 요청하는 함수
   * - 호버기능 : 펜의 위치를 penDown 전에 미리 가늠해 볼 수 있도록 시각적인 dot를 표시하는 기능
   * @param {boolean} enable - on / off
   */
  SetHoverEnable(enable: boolean) {
    this.Request(
      () => this.mClientV1.SetHoverEnable(enable),
      () => this.mClientV2.ReqSetupHoverMode(enable)
    );
  }

  /**
   * 펜 설정 중 오프라인 저장 기능을 변경 요청하는 함수
   * @param {boolean} enable - on / off
   */
  SetOfflineDataEnable(enable: boolean) {
    this.Request(null, () => this.mClientV2.ReqSetupOfflineData(enable));
  }

  /**
   * 펜 설정 중 펜 LED 색을 변경 요청하는 함수
   * @param {number} color - argb
   */
  SetColor(color: number) {
    this.Request(
      () => this.mClientV1.ReqSetupPenColor(color),
      () => this.mClientV2.ReqSetupPenColor(color)
    );
  }

  /**
   * 펜 설정 중 펜의 필압 민감도를 변경 요청하는 함수
   * - FSR 필압 센서가 달린 모델에서만 이용
   * @param {number} step - 0 ~ 4 ( 0이 가장 민감 )
   */
  SetSensitivity(step: number) {
    this.Request(
      () => this.mClientV1.ReqSetupPenSensitivity(step),
      () => this.mClientV2.ReqSetupPenSensitivity(step)
    );
  }

  /**
   * 펜 설정 중 펜의 디스크를 초기화 요청하는 함수
   */
  RequestInitPenDisk() {
    this.Request(
      () => this.mClientV1.ReqInitPenDisk(),
      () => this.mClientV2.ReqInitPenDisk()
    );
  }

  /**
   * 펜의 실시간 필기 데이터에 대한 전송을 요청하는 함수
   * @param {array} sections
   * @param {array} owners
   * @param {(array | null)}notes - null일 경우 노트를 구분하지 않는다.
   */
  RequestAvailableNotes(sections: number[], owners: number[], notes: number[] | null) {
    this.Request(
      () => this.mClientV1.ReqAddUsingNotes(sections, owners, notes),
      () => this.mClientV2.ReqAddUsingNotes(sections, owners, notes)
    );
  }

  // Offline List
  // setion or owner  = null : All Note
  /**
   * 펜에 저장된 오프라인 필기 데이터의 종이 정보(note)를 요청하는 함수
   * - section, owner 모두 0일 경우 저장된 모든 note ID 리스트 (최대 64개)를 요청한다.
   * @param {number} section
   * @param {number} owner
   */
  RequestOfflineNoteList(section: number, owner: number) {
    this.Request(
      () => this.mClientV1.ReqOfflineDataList(),
      () => this.mClientV2.ReqOfflineNoteList(section, owner)
    );
  }

  /**
   * 펜에 저장된 오프라인 필기 데이터의 종이 정보(page)를 요청하는 함수
   * - section, owner, note 와 일치하는 하나의 노트의 page ID 리스트 (최대 128개)를 요청한다.
   * @param {number} section
   * @param {number} owner
   * @param {number} note
   */
  RequestOfflinePageList(section: number, owner: number, note: number) {
    this.Request(
      () => this.mClientV1.ReqOfflineDataList(),
      () => this.mClientV2.ReqOfflinePageList(section, owner, note)
    );
  }

  // Offline Data
  /**
   * 펜에 저장된 오프라인 필기 데이터를 한 note ID 혹은 다수의 page ID로 요청하는 함수
   * @param {number} section
   * @param {number} owner
   * @param {number} note
   * @param {boolean} deleteOnFinished - true일 경우 전송한 데이터 삭제, false일 경우 전송한 데이터 삭제 안함
   * @param {array} pages - 빈 배열일 경우 노트 내 모든 page를 요청
   * @returns
   */
  RequestOfflineData(section: number, owner: number, note: number, deleteOnFinished: boolean = true, pages: any = []) {
    return this.Request(
      () => this.mClientV1.ReqOfflineData(),
      () => {
        return this.mClientV2.ReqOfflineData(section, owner, note, deleteOnFinished, pages);
      }
    );
  }

  /**
   * 펜에 저장된 오프라인 필기 데이터에 대한 삭제를 요청하는 함수
   * - 노트 단위 삭제, 최대 64개
   * @param {number} section
   * @param {number} owner
   * @param {array} notes
   */
  RequestOfflineDelete(section: number, owner: number, notes: number[]) {
    this.Request(
      () => this.mClientV1.ReqOfflineDelete(),
      () => {
        this.mClientV2.ReqOfflineDelete(section, owner, notes);
      }
    );
  }

  // Firmware Update
  /**
   * 펜에 설치된 펌웨어를 업그레이드하기 위해 펜에게 질의하는 함수
   * @param {File} file
   * @param {string} version
   * @param {boolean} isCompressed
   */
  RequestFirmwareInstallation(file: File, version: string, isCompressed: boolean) {
    this.Request(
      () => this.mClientV1.ReqPenSwUpgrade(file),
      () => {
        this.mClientV2.ReqPenSwUpgrade(file, version, isCompressed);
      }
    );
  }

  /**
   * 펜에 펌웨어 데이터를 업로드하는 함수
   * @param {number} offset
   * @param {Uint8Array} data
   * @param {number} status
   */
  RequestFirmwareUpload(offset: number, data: Uint8Array, status: number) {
    this.Request(
      () => this.mClientV1.ReqPenSwUpload(),
      () => this.mClientV2.ReqPenSwUpload(offset, data, status)
    );
  }

  /**
   * 펜에 프로파일 생성을 요청하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @param {string} password
   */
  RequestProfileCreate = (name: string, password: string) => {
    this.Request(
      () => this.mClientV1.ReqProfileCreate(name, password),
      () => this.mClientV2.ReqProfileCreate(name, password)
    );
  };

  /**
   * 펜에 설정된 프로파일 제거를 요청하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @param {string} password
   */
  RequestProfileDelete = (name: string, password: string) => {
    this.Request(
      () => this.mClientV1.ReqProfileDelete(name, password),
      () => this.mClientV2.ReqProfileDelete(name, password)
    );
  };

  /**
   * 펜에 설정된 프로파일 정보를 요청하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   */
  RequestProfileInfo = (name: string) => {
    this.Request(
      () => this.mClientV1.ReqProfileInfo(name),
      () => this.mClientV2.ReqProfileInfo(name)
    );
  };

  /**
   * 펜에 설정된 프로파일 내 데이터 작성을 요청하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @param {string} password
   * @param {Array} keys
   * @param {Array} data
   */
  RequestProfileWriteValue = (name: string, password: string, data: { [key: string]: any }) => {
    // this.ReqProfileWriteValue("test","test",{
    //   "test": 123
    // })

    this.Request(
      () => this.mClientV1.ReqProfileWriteValue(name, password, data),
      () => this.mClientV2.ReqProfileWriteValue(name, password, data)
    );
  };

  /**
   * 펜에 설정된 프로파일 내 데이터 정보를 요청하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @param {Array} keys
   */
  RequestProfileReadValue = (name: string, keys: string[]) => {
    this.Request(
      () => this.mClientV1.ReqProfileReadValue(name, keys),
      () => this.mClientV2.ReqProfileReadValue(name, keys)
    );
  };

  /**
   * 펜에 설정된 프로파일 내 데이터 제거를 요청하는 함수
   * - 프로파일은 네오랩을 통해 인증받은 뒤에 사용가능하기에, 현재는 고정값을 이용
   * @param {string} name
   * @param {string} password
   * @param {Array} keys
   */
  RequestProfileDeleteValue = (name: string, password: string, keys: string[]) => {
    this.Request(
      () => this.mClientV1.ReqProfileDeleteValue(name, password, keys),
      () => this.mClientV2.ReqProfileDeleteValue(name, password, keys)
    );
  };

  OnConnected() {
    if (this.Protocol !== 1) {
      this.mParserV2.state.first = true;
      this.mClientV2.ReqVersionTask();
    }
  }

  OnDisconnected() {
    if (this.Protocol === 1) this.mClientV1.OnDisconnected();
    else this.mClientV2.OnDisconnected();
    this.mParserV2.OnDisconnected();
    this.onMessage!(this, PenMessageType.PEN_DISCONNECTED, null);
  }
}
