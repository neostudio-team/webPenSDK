import ByteUtil, { GetSectionOwner } from "../Util/ByteUtil";
import {Packet, PacketBuilder} from "./Packet";
import * as Converter from '../Util/Converter'
import * as NLog from '../Util/NLog'
import Dot from "../API/Dot";
import CMD from "./CMD";
import CONST from "./Const";
import * as Res from "../Model/Response";
import zlib from "zlib";


import PenMessageType, { SettingType, PenTipType, ErrorType } from "../API/PenMessageType";
import PenController from "./PenController";
import DotFilter from "../Util/DotFilter";

export default class PenClientParserV2 {
  penController: PenController
  penVersionInfo: any
  penSettingInfo: any
  current: any
  state: any
  mBuffer: any
  IsEscape: boolean
  offline: any
  IsUploading: boolean

  constructor(penController: PenController) {
    this.penController = penController;

    this.penVersionInfo = {}; // ref) Response.VersionInfo
    this.penSettingInfo = {}; // ref) Response.SettingInfo

    this.current = {
      Section: -1,
      Owner: -1,
      Note: -1,
      Page: -1,
      Time: -1
    };

    this.state = {
      first: true,
      mPenTipType: 0,
      mPenTipColor: -1,
      IsStartWithDown: false,
      mDotCount: -1,
      reCheckPassword: false,
      newPassword: null,
      mPrevDot: null,
      IsBeforeMiddle: false,
      IsStartWithPaperInfo: false,
      SessionTs: -1,
      EventCount: -1
    };

    this.mBuffer = null;
    this.IsEscape = false;

    this.offline = {
      mTotalOfflineStroke: -1,
      mReceivedOfflineStroke: 0,
      mTotalOfflineDataSize: -1
    };

    this.IsUploading = true
  }

  // MARK: ParsePacket
  /**
   * 전달된 패킷의 커맨드 바이트를 확인 후, 각 커맨드로 패킷을 연결시키는 함수
   * - 패킷 파싱의 두 번째 단계, 해당 함수를 호출하기 위해서는 ProtocolParse 작업이 필요하다.
   * @param {Packet} packet 
   * @returns 
   */
  ParsePacket(packet: Packet) {
    let cmd = packet.Cmd;
    NLog.log("ParsePacket", cmd, "0x" + cmd.toString(16))
    NLog.log("ParsePacket", packet.Data)

    if (packet.Result > 0) {
      NLog.log("packet result failed", packet);
      return;
    }

    switch (cmd) {
      case CMD.VERSION_RESPONSE:
        let versionInfo = Res.VersionInfo(packet);
        this.penVersionInfo = versionInfo;
        this.penController.info = versionInfo
        this.IsUploading = false;
        this.state.EventCount = 0;
        NLog.log("ParsePacket Version Info", versionInfo);
        this.ReqPenStatus();
        break;

      case CMD.SHUTDOWN_EVENT:
        let shutdownReason = packet.GetByte();
        NLog.log("ParsePacket power off", shutdownReason);
        this.penController.onMessage!( this.penController, PenMessageType.EVENT_POWER_OFF, {
          shutdownReason
        });
        break;

      case CMD.LOW_BATTERY_EVENT:
        let battery = packet.GetByte();
        this.penController.onMessage!( this.penController, PenMessageType.EVENT_LOW_BATTERY, {
          Battery: battery
        });
        break;

      // MARK: CMD Up & Down New
      case CMD.ONLINE_NEW_PEN_DOWN_EVENT:
        this.NewPenDown(packet);
        break;

      case CMD.ONLINE_NEW_PEN_UP_EVENT:
        this.NewPenUp(packet);
        break;

      // MARK: CMD Up & Down Old
      case CMD.ONLINE_PEN_UPDOWN_EVENT:
        this.PenUpDown(packet);
        break;

      // MARK: CMD Dot
      case CMD.ONLINE_PEN_DOT_EVENT:
      case CMD.ONLINE_NEW_PEN_DOT_EVENT:
        this.PenDotEvent(cmd, packet);
        break;

      case CMD.ONLINE_PAPER_INFO_EVENT:
      case CMD.ONLINE_NEW_PAPER_INFO_EVENT:
        this.PaperInfoEvent(cmd, packet);
        break;

      case CMD.ONLINE_PEN_ERROR_EVENT:
      case CMD.ONLINE_NEW_PEN_ERROR_EVENT:
        this.PenErrorDot(cmd, packet);
        break;

      case CMD.SETTING_INFO_RESPONSE:
        let settingInfo = Res.SettingInfo(packet);
        this.penSettingInfo = settingInfo;
        NLog.log("ParsePacket SETTING_INFO_RESPONSE", settingInfo, "first Connection?", this.state.first);

        // 최초 연결시
        if (this.state.first) {
          this.state.first = false;
          this.penController.onMessage!( this.penController, PenMessageType.PEN_SETTING_INFO, settingInfo);

          if (settingInfo.Locked) {
            this.penController.onMessage!( this.penController, PenMessageType.PEN_PASSWORD_REQUEST, {
              RetryCount: settingInfo.RetryCount,
              ResetCount: settingInfo.ResetCount
            });
          } else {
            this.penController.onMessage!( this.penController, PenMessageType.PEN_AUTHORIZED, null);
          }
        } else {
          this.penController.onMessage!( this.penController, PenMessageType.PEN_SETTING_INFO, settingInfo);
        }
        break;

      case CMD.SETTING_CHANGE_RESPONSE:
        let settingChangeResult = Res.SettingChange(packet);
        this.penController.onMessage!( this.penController, PenMessageType.PEN_SETUP_SUCCESS, settingChangeResult);
        break;

      // password
      case CMD.PASSWORD_RESPONSE:
        let password = Res.Password(packet);
        NLog.log("ParsePacket PASSWORD_RESPONSE", password);
        if (password.status === 1) {
          if (this.state.reCheckPassword) {
            this.penController.onMessage!( this.penController, PenMessageType.PEN_SETTING_INFO, password);
            this.state.reCheckPassword = false;
            break;
          }
          this.penController.onMessage!( this.penController, PenMessageType.PEN_AUTHORIZED, null);
        } else {
          if (this.state.reCheckPassword) {
            this.state.reCheckPassword = false;
            this.penController.onMessage!( this.penController, PenMessageType.PASSWORD_SETUP_FAILURE, null);
          } else {
            this.penController.onMessage!( this.penController, PenMessageType.PEN_PASSWORD_REQUEST, password);
          }
        }
        break;
      case CMD.PASSWORD_CHANGE_RESPONSE:
        let passwordChange = Res.PasswordChange(packet);

        if (packet.Result === 0x00) {
          this.state.reCheckPassword = true;
          this.penController.ReqInputPassword(this.state.newPassword);
        } else {
          this.state.newPassword = "";
          this.penController.onMessage!( this.penController, PenMessageType.PASSWORD_SETUP_FAILURE, passwordChange);
        }
        break;

      // MARK: CMD Offline
      case CMD.OFFLINE_NOTE_LIST_RESPONSE:
        {
          let noteList = Res.NoteList(packet)
          this.penController.onMessage!( this.penController, PenMessageType.OFFLINE_DATA_NOTE_LIST, noteList);
        }
        break;
      case CMD.OFFLINE_PAGE_LIST_RESPONSE:
        {
          let pageList = Res.PageList(packet)
          this.penController.onMessage!( this.penController, PenMessageType.OFFLINE_DATA_PAGE_LIST, pageList);
        }
        break;
      case CMD.OFFLINE_DATA_RESPONSE:
        {
          this.offline.mTotalOfflineStroke = packet.GetInt();
          this.offline.mReceivedOfflineStroke = 0;
          this.offline.mTotalOfflineDataSize = packet.GetInt();

          let offlineInfo = {
            isCompressed: packet.GetByte() === 1,
            stroke: this.offline.mTotalOfflineStroke,
            bytes: this.offline.mTotalOfflineDataSize
          };
          NLog.log("OFFLINE_DATA_RESPONSE ", offlineInfo);
          this.penController.onMessage!( this.penController, PenMessageType.OFFLINE_DATA_SEND_START, null);
        }
        break;

      case CMD.OFFLINE_PACKET_REQUEST:
        this.ResOfflineData(packet);
        break;

      case CMD.OFFLINE_DATA_DELETE_RESPONSE:
        // NLog.log("OFFLINE_DATA_DELETE_RESPONSE", packet);
        this.penController.onMessage!( this.penController, PenMessageType.OFFLINE_DATA_DELETE_RESPONSE, { Result: packet.Result === 0x00 });
        break;

      // MARK: CMD Firmware Response
      case CMD.FIRMWARE_UPLOAD_RESPONSE:
        if (packet.Result !== 0 || packet.GetByte() !== 0) {
          this.IsUploading = false;
          this.penController.onMessage!( this.penController, PenMessageType.PEN_FW_UPGRADE_SUCCESS, {
            Result: false
          });
        }
        break;

      case CMD.FIRMWARE_PACKET_REQUEST:
        {
          let firmwareRes ={
            status: packet.GetByte(),
            offset: packet.GetInt()
          }

          this.ResponseChunkRequest(firmwareRes.offset, firmwareRes.status !== 3);
        }
        break;

      case CMD.ONLINE_DATA_RESPONSE:
        NLog.log("Using Note Set", packet.Result);
        this.ReqSetupTime();
        break;

      case CMD.RES_PDS:
        let pds = Res.PDS(packet);
        this.penController.onMessage!( this.penController, PenMessageType.RES_PDS, pds);
        break;

      default:
        NLog.log("ParsePacket: not implemented yet", packet);
        break;
    }
  }

  /**
   * 패킷을 반환받을 때 해당 패킷이 순차적으로 바르게 들어온 것인지 확인하는 함수
   * @param {number} ecount 
   */
  CheckEventCount(ecount: number) {
    //Debug.WriteLine("COUNT : " + ecount + ", " + EventCount);

    if (ecount - this.state.EventCount !== 1 && (ecount !== 0 || this.state.EventCount !== 255)) {
      let errorDot = null;

      if (this.state.mPrevDot != null) {
        errorDot = this.state.mPrevDot.Clone();
        errorDot.dotType = Dot.DotTypes.PEN_ERROR;
      }

      if (ecount - this.state.EventCount > 1) {
        let extraData = "missed event count " + (this.state.EventCount + 1) + "-" + (ecount - 1);
        this.penController.onErrorDetected({
          ErrorType: ErrorType.InvalidEventCount,
          Dot: errorDot,
          Timestamp: this.state.SessionTs,
          ExtraData: extraData
        });
      } else if (ecount < this.state.EventCount) {
        let extraData = "invalid event count " + this.state.EventCount + "," + ecount;
        this.penController.onErrorDetected({
          ErrorType: ErrorType.InvalidEventCount,
          Dot: errorDot,
          Timestamp: this.state.SessionTs,
          ExtraData: extraData
        });
      }
    }

    this.state.EventCount = ecount;
  }
  // MARK: Parse (Up & Down)
  /**
   * 실시간으로 펜 DOWN 시, 전달된 패킷에서 시각, 펜의 타입, 펜의 색상을 파싱하고, 펜 이벤트의 설정 값들을 초기화하는 함수
   * - 패킷 파싱의 마지막 단계, 해당 함수를 호출하기 위해서는 ParsePacket 작업이 필요하다.
   * @param {Packet} pk 
   */
  NewPenDown(pk: Packet) {
    if (this.state.IsStartWithDown && this.state.IsBeforeMiddle && this.state.mPrevDot !== null) {
      this.MakeUpDot();
    }
    let ecount = pk.GetByte();
    this.CheckEventCount(ecount);
    this.state.IsStartWithDown = true;
    this.current.Time = pk.GetLong();
    this.state.SessionTs = this.current.Time;
    this.state.IsBeforeMiddle = false;
    this.state.IsStartWithPaperInfo = false;
    this.state.IsStartWithPaperInfo = false;
    this.state.mDotCount = 0;
    this.state.mPenTipType = pk.GetByte() === 0x00 ? PenTipType.Normal : PenTipType.Eraser;
    this.state.mPenTipColor = pk.GetInt();
    this.state.mPrevDot = null;
  }

  /**
   * 실시간으로 펜 UP 시, 전달된 패킷에서 시각, 전송 및 처리 된 도트, 이미지 개수를 파싱하고, 펜 이벤트의 설정 값들을 초기화하는 함수
   * - 정상적으로 PenDown -> PenMove -> PenUp 의 동작을 수행했다면 Up Dot를 전달한다.
   * - 패킷 파싱의 마지막 단계, 해당 함수를 호출하기 위해서는 ParsePacket 작업이 필요하다.
   * @param {Packet} pk 
   */
  NewPenUp(pk: Packet) {
    let ecount = pk.GetByte();
    this.CheckEventCount(ecount);
    let timestamp = pk.GetLong();
    new Date(timestamp);
    // NLog.log("ONLINE_NEW_PEN_UP_EVENT timestamp", new Date(timestamp));
    let dotCount = pk.GetShort();
    let totalImageCount = pk.GetShort();
    let procImageCount = pk.GetShort();
    let succImageCount = pk.GetShort();
    let sendImageCount = pk.GetShort();
    if (this.state.IsStartWithDown && this.state.IsBeforeMiddle && this.state.mPrevDot !== null) {
      let udot = this.state.mPrevDot.Clone();
      udot.dotType = Dot.DotTypes.PEN_UP;
      let imageInfo = null;
      if (!this.state.IsStartWithPaperInfo) {
        imageInfo = {
          DotCount: dotCount,
          Total: totalImageCount,
          Processed: procImageCount,
          Success: succImageCount,
          Transferred: sendImageCount
        };
      }
      this.ProcessDot(udot);
    } else if (!this.state.IsStartWithDown && !this.state.IsBeforeMiddle) {
      // 즉 다운업(무브없이) 혹은 업만 들어올 경우 UP dot을 보내지 않음
      this.penController.onErrorDetected({
        ErrorType: ErrorType.MissingPenDownPenMove,
        Timestamp: -1
      });
    } else if (!this.state.IsBeforeMiddle) {
      // 무브없이 다운-업만 들어올 경우 UP dot을 보내지 않음
      this.penController.onErrorDetected({
        ErrorType: ErrorType.MissingPenMove,
        Timestamp: this.state.SessionTs
      });
    }
    this.current.Time = -1;
    this.state.SessionTs = -1;
    this.state.IsStartWithDown = false;
    this.state.IsBeforeMiddle = false;
    this.state.IsStartWithPaperInfo = false;
    this.state.IsStartWithPaperInfo = false;
    this.state.mDotCount = 0;
    this.state.mPrevDot = null;
  }

  /**
   * 실시간으로 펜 Up, Down 시, 전달된 패킷에서 시각, 펜의 타입, 펜의 색상을 파싱하고, 펜 이벤트의 설정 값들을 초기화하는 함수
   * - 펜 펌웨어 버전이 2.13 이전일 때 사용
   * - 패킷 파싱의 마지막 단계, 해당 함수를 호출하기 위해서는 ParsePacket 작업이 필요하다.
   * @param {Packet} pk 
   */
  PenUpDown(pk: Packet) {
    let IsDown = pk.GetByte() === 0x00;
    if (IsDown) {
      if (this.state.IsStartWithDown && this.state.IsBeforeMiddle && this.state.mPrevDot !== null) {
        this.MakeUpDot();
      }
      this.state.IsStartWithDown = true;
      this.current.Time = pk.GetLong();
      this.state.SessionTs = this.current.Time;
    } else {
      if (this.state.IsStartWithDown && this.state.IsBeforeMiddle && this.state.mPrevDot !== null) {
        this.MakeUpDot(false);
      } else if (!this.state.IsStartWithDown && !this.state.IsBeforeMiddle) {
        // 즉 다운업(무브없이) 혹은 업만 들어올 경우 UP dot을 보내지 않음
        this.penController.onErrorDetected({
          ErrorType: ErrorType.MissingPenDownPenMove,
          Timestamp: -1
        });
      } else if (!this.state.IsBeforeMiddle) {
        // 무브없이 다운-업만 들어올 경우 UP dot을 보내지 않음
        this.penController.onErrorDetected({
          ErrorType: ErrorType.MissingPenMove,
          Timestamp: this.state.SessionTs
        });
      }
      this.state.IsStartWithDown = false;
      this.current.Time = -1;
      this.state.SessionTs = -1;
    }
    this.state.IsBeforeMiddle = false;
    this.state.IsStartWithPaperInfo = false;
    this.state.IsStartWithPaperInfo = false;
    this.state.mDotCount = 0;
    this.state.mPenTipType = pk.GetByte() === 0x00 ? PenTipType.Normal : PenTipType.Eraser;
    this.state.mPenTipColor = pk.GetInt();
    this.state.mPrevDot = null;
  }

  /**
   * 실시간으로 필기 데이터 전송에 실패했을 경우, 전달된 패킷에서 에러 환경에 대한 정보 값을 파싱하는 함수  
   * - 패킷 파싱의 마지막 단계, 해당 함수를 호출하기 위해서는 ParsePacket 작업이 필요하다.
   * @param {number} cmd - packetCount 추가된 패킷인지 확인하기 위한 커맨드
   * @param {Packet} pk 
   */
  PenErrorDot(cmd: number, pk: Packet) {
    if (cmd === CMD.ONLINE_NEW_PEN_ERROR_EVENT) {
      let ecount = pk.GetByte();
      this.CheckEventCount(ecount);
    }
    let timeadd = pk.GetByte();
    this.current.Time += timeadd;
    let force = pk.GetShort();
    let brightness = pk.GetByte();
    let exposureTime = pk.GetByte();
    let ndacProcessTime = pk.GetByte();
    let labelCount = pk.GetShort();
    let ndacErrorCode = pk.GetByte();
    let classType = pk.GetByte();
    let errorCount = pk.GetByte();
    let newInfo = {
      Timestamp: this.current.Time,
      force,
      brightness,
      exposureTime,
      ndacProcessTime,
      labelCount,
      ndacErrorCode,
      classType,
      errorCount
    };
    let errorDot = null;
    if (this.state.mPrevDot != null) {
      errorDot = this.state.mPrevDot.Clone();
      errorDot.dotType = Dot.DotTypes.PEN_UP;
    }
    this.penController.onErrorDetected({
      ErrorType: ErrorType.ImageProcessingError,
      Dot: errorDot,
      Timestamp: this.state.SessionTs,
      ImageProcessErrorInfo: newInfo
    });
  }

  // MARK: Parse Paper
  /**
   * 실시간으로 필기 데이터 전송 시, 전달된 패킷에서 입력된 종이의 정보(section, owner, note, page)를 파싱하는 함수
   * - 패킷 파싱의 마지막 단계, 해당 함수를 호출하기 위해서는 ParsePacket 작업이 필요하다.
   * @param {number} cmd - packetCount 추가된 패킷인지 확인하기 위한 커맨드
   * @param {Packet} pk 
   */
  PaperInfoEvent(cmd: number, pk: Packet) {
    if (cmd === CMD.ONLINE_NEW_PAPER_INFO_EVENT) {
      let ecount = pk.GetByte();

      this.CheckEventCount(ecount);
    }

    // 미들도트 중에 페이지가 바뀐다면 강제로 펜업을 만들어 준다.
    if (this.state.IsStartWithDown && this.state.IsBeforeMiddle && this.state.mPrevDot !== null) {
      this.MakeUpDot(false);
    }

    let rb = pk.GetBytes(4);

    this.current.Section = rb[3] & 0xff;
    this.current.Owner = Converter.byteArrayToInt(new Uint8Array([rb[0], rb[1], rb[2], 0x00]));
    this.current.Note = pk.GetInt();
    this.current.Page = pk.GetInt();

    this.state.mDotCount = 0;

    this.state.IsStartWithPaperInfo = true;
  }

  // MARK: Parse Dot
  /**
   * 실시간으로 필기 데이터 전송 시, 전달된 패킷에서 입력된 Dot의 각종 값(좌표, 기울기, 필압 등)을 파싱하는 함수
   * - 정상적으로 PenDown -> PenMove, PageInfo 를 수행했다면 moveDot를 Move Dot를 전달한다.
   * - 패킷 파싱의 마지막 단계, 해당 함수를 호출하기 위해서는 ParsePacket 작업이 필요하다.
   * @param {number} cmd - packetCount 추가된 패킷인지 확인하기 위한 커맨드
   * @param {Packet} pk 
   */
  PenDotEvent(cmd: number, pk: Packet) {
    if (cmd === CMD.ONLINE_NEW_PEN_DOT_EVENT) {
      let ecount = pk.GetByte();

      this.CheckEventCount(ecount);
    }

    let timeadd = pk.GetByte();
    this.current.Time += timeadd;
    let force = parseFloat((pk.GetShort() / this.penSettingInfo.MaxForce).toFixed(4));
    let x = pk.GetShort();
    let y = pk.GetShort();
    let fx = pk.GetByte();
    let fy = pk.GetByte();
    x += fx * 0.01;
    y += fy * 0.01;
    let tx = pk.GetByte();
    let ty = pk.GetByte();
    let twist = pk.GetShort();
    let angel = {
      tx,
      ty,
      twist
    };
    let dot = null;

    if (!this.penSettingInfo.HoverMode && !this.state.IsStartWithDown) {
      if (!this.state.IsStartWithPaperInfo) {
        //펜 다운 없이 페이퍼 정보 없고 무브가 오는 현상(다운 - 무브 - 업 - 다운X - 무브)
        this.penController.onErrorDetected({
          ErrorType: ErrorType.MissingPenDown,
          Timestamp: -1
        });
      } else {
        this.current.Time = Date.now();

        this.state.SessionTs = this.current.Time;

        let errorDot = Dot.MakeDot(this.current, x, y, force, Dot.DotTypes.PEN_ERROR, this.state.mPenTipType, this.state.mPenTipColor, angel);

        //펜 다운 없이 페이퍼 정보 있고 무브가 오는 현상(다운 - 무브 - 업 - 다운X - 무브)
        this.penController.onErrorDetected({
          ErrorType: ErrorType.MissingPenDown,
          Dot: errorDot,
          Timestamp: this.state.SessionTs
        });

        this.state.IsStartWithDown = true;
        this.state.IsStartWithPaperInfo = true;
      }
    }

    if (this.penSettingInfo.HoverMode && !this.state.IsStartWithDown) {
      dot = Dot.MakeDot(this.current, x, y, force, Dot.DotTypes.PEN_HOVER,  this.state.mPenTipType, this.state.mPenTipColor, angel);
    } else if (this.state.IsStartWithDown) {
      if (this.state.IsStartWithPaperInfo) {
        dot = Dot.MakeDot(
          this.current,
          x,
          y,
          force,
          this.state.mDotCount === 0 ? Dot.DotTypes.PEN_DOWN : Dot.DotTypes.PEN_MOVE,
          this.state.mPenTipType,
          this.state.mPenTipColor,
          angel
        );
      } else {
        //펜 다운 이후 페이지 체인지 없이 도트가 들어왔을 경우
        this.penController.onErrorDetected({
          ErrorType: ErrorType.MissingPageChange,
          Timestamp: this.state.SessionTs
        });
      }
    }

    if (dot != null) {
      this.ProcessDot(dot);
    }

    this.state.IsBeforeMiddle = true;
    this.state.mPrevDot = dot;
    this.state.mDotCount++;
  }

  /**
   * 펜의 블루투스 연결이 끊어졌을 경우, 펜 이벤트의 설정 값들을 초기화하는 함수
   */
  OnDisconnected() {
    if (this.state.IsStartWithDown && this.state.IsBeforeMiddle && this.state.mPrevDot !== null) {
      this.MakeUpDot();
      this.current.Time = -1;
      this.state.SessionTs = -1;
      this.state.IsStartWithDown = false;
      this.state.IsBeforeMiddle = false;
      this.state.IsStartWithPaperInfo = false;
      this.state.mDotCount = 0;
      this.state.mPrevDot = null;
    }
  }

  //TODO
  UpDotTimerCallback() {
    NLog.log("UpDotTimerCallback");

    if (this.state.IsStartWithDown && this.state.IsBeforeMiddle && this.state.mPrevDot !== null) {
      this.MakeUpDot();
      this.current.Time = -1;
      this.state.SessionTs = -1;
      this.state.IsStartWithDown = false;
      this.state.IsBeforeMiddle = false;
      this.state.IsStartWithPaperInfo = false;
      this.state.mDotCount = 0;
      this.state.mPrevDot = null;
    }
  }

  /**
   * 펜업 이벤트를 강제로 발생시키기 위한 함수, 또한 참일 경우 에러 메시지 송출
   * @param {boolean} isError 
   */
  MakeUpDot(isError = true) {
    if (isError) {
      let errorDot = this.state.mPrevDot.Clone();
      errorDot.dotType = Dot.DotTypes.PEN_ERROR;
      this.penController.onErrorDetected({
        ErrorType: ErrorType.MissingPenUp,
        Dot: errorDot,
        Timestamp: this.state.SessionTs
      });
    }

    let audot = this.state.mPrevDot.Clone();
    audot.dotType = Dot.DotTypes.PEN_UP;
    this.ProcessDot(audot);
  }

  // MARK: Parse Offline
  /**
   * 오프라인 필기 데이터 전송 시, 전달된 패킷에서 압축여부, 전송 위치, 종이 정보, 필기 데이터 등 오프라인 데이터를 파싱하는 함수
   * - 패킷 파싱의 마지막 단계, 해당 함수를 호출하기 위해서는 ParsePacket 작업이 필요하다.
   * @param {Packet} packet 
   */
  ResOfflineData(packet: Packet) {
    const packetid = packet.GetShort();
    const isCompressed = packet.GetByte() === 1 ? true : false;
    const beforsize = packet.GetShort();
    const aftersize = packet.GetShort();
    const transPosition = packet.GetByte(); // 0: start, 1: middle, 2: end
    const rb = packet.GetBytes(4);
    const [Section, Owner] = GetSectionOwner(rb);
    const Note = packet.GetInt();
    const strokeCount = packet.GetShort();
    const data = packet.GetBytes(null);
    const Paper = {
      packetid,
      isCompressed,
      beforsize,
      aftersize,
      transPosition,
      Section,
      Owner,
      Note,
      strokeCount,
      dataSize: data.length
    };
    // NLog.log("offlineData info", offlineInfo);
    if (isCompressed) {
      let u8 = new Uint8Array(data);
      zlib.unzip(u8, (err, res) => {
        if (!err) {
          // NLog.log("Offline zip file received successfully");
          let unzipU8 = new Uint8Array(res);
          this.ParseSDK2OfflinePenData(unzipU8, Paper);
        } else {
          NLog.log("unzip error", err);
        }
      });
    } else {
      // NLog.log("not compressed Offline file received successfully");
      let u8 = new Uint8Array(data);
      this.ParseSDK2OfflinePenData(u8, Paper);
    }

    if (transPosition === 2) {
      // NLog.log("OFFLINE_DATA_RECEIVE_END");
      this.penController.onMessage!(this.penController, PenMessageType.OFFLINE_DATA_SEND_STATUS, 100);
    } else {
      this.offline.mReceivedOfflineStroke += strokeCount;
      // NLog.log("OFFLINE_DATA_RECEIVE", strokeCount, this.offline.mReceivedOfflineStroke);
      this.ReqOfflineData2(packetid, true, false);
      let percent = (this.offline.mReceivedOfflineStroke * 100) / this.offline.mTotalOfflineStroke;
      this.penController.onMessage!( this.penController, PenMessageType.OFFLINE_DATA_SEND_STATUS, percent);
    }
  }

  /**
   * 오프라인 필기 데이터 전송 시, 오프라인 데이터 내의 stroke 데이터 (PenUpDown 시각, 펜 타입, 
   * 펜 색상, 도트 수) 및 dot 데이터 (좌표, 기울기, 필압 등)를 파싱하고 stroke 배열에 dot를 추가하는 함수
   * - Paper ⊃ Stroke ⊃ Dot
   * - 해당 함수를 호출하기 위해서는 ResOfflineData 작업이 필요하다.
   * @param {array} u8 
   * @param {any} paper - 오프라인 데이터로 구성된 페이퍼
   */
  ParseSDK2OfflinePenData(u8: Uint8Array, paper: any) {
    // NLog.log("OfflineStrokeParser", u8);
    let strokes = [];
    let packet = new PacketBuilder().data(u8).Build();
    let strokeCount = paper.strokeCount;

    for (let i = 0; i < strokeCount; i++) {
      let page = packet.GetInt();
      let downTime = packet.GetLong();
      packet.GetLong(); // upTime
      let penTipType = packet.GetByte(); // penTipType
      let penTipColor = packet.GetInt();
      let dotCount = packet.GetShort();
      paper.Page = page;
      paper.Time = downTime;
      let Dots = [];
      for (let j = 0; j < dotCount; j++) {
        let nTimeDelta = packet.GetByte();
        let force = packet.GetShort();
        let x = packet.GetShort();
        let y = packet.GetShort();
        let fx = packet.GetByte();
        let fy = packet.GetByte();
        x += fx * 0.01;
        y += fy * 0.01;
        let xtilt = packet.GetByte();
        let ytilt = packet.GetByte();
        let twist = packet.GetShort();
        packet.GetShort(); // reserved
        packet.GetByte(); // nCheckSum

        let angel = {
          tx: xtilt,
          ty: ytilt,
          twist: twist
        };
        paper.Time += nTimeDelta;
        let dottype = Dot.DotTypes.PEN_MOVE;
        if (j === 0) dottype = Dot.DotTypes.PEN_DOWN;
        if (j === dotCount - 1) dottype = Dot.DotTypes.PEN_UP;
        let dot = Dot.MakeDot(paper, x, y, force, dottype, penTipType, penTipColor, angel);
        Dots.push(dot);
      }
      let stroke = { Dots };
      strokes.push(stroke);
    }
    // NLog.log(strokes)
    this.penController.onMessage!( this.penController, PenMessageType.OFFLINE_DATA_SEND_SUCCESS, strokes);
  }

  // NOTE: Request(Offline Receive Response)
  /**
   * 오프라인 필기 데이터를 전송받았을 때, 전송 여부 등을 펜으로 반환하는 함수
   * - 해당 함수를 호출하기 위해서는 ResOfflineData 작업이 필요하다.
   * @param {number} index 
   * @param {boolean} isSuccess
   * @param {boolean} end - true일 경우 전송 중단, false일 경우 계속 전송
   */
  ReqOfflineData2(index: number, isSuccess = true, end = false) {
    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.OFFLINE_PACKET_RESPONSE)
      .Put(isSuccess ? 0 : 1)
      .PutShort(3)
      .PutShort(index)
      .Put(end ? 0 : 1)
      .Put(CONST.PK_ETX, false);
    // NLog.log("ReqOfflineData2", bf);
    this.Send(bf);
  }

  // NOTE: Request(PenStatus)
  /**
   * 각종 펜 설정에 대한 정보를 요청하는 함수
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

  // NOTE: Request(SetupTime)
  /**
   * 펜 설정 중 시각에 대해 현재 시각으로 변경을 요청하는 함수
   * @returns 
   */
  ReqSetupTime() {
    let timetick = Date.now();
    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.SETTING_CHANGE_REQUEST)
      .PutShort(9)
      .Put(SettingType.Timestamp)
      .PutLong(timetick)
      .Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  // MARK: Parse Start(Step 1)
  /**
   * Step3 Send Data from Pen
   * 패킷이 들어올 때, 버퍼 공간을 만들고 escape 처리를 하며 버퍼에 패킷을 전달하는 함수
   * - 패킷 파싱의 첫 번째 단계
   * @param {array} buff - uint8array
   */
  ProtocolParse(buff: Uint8Array) {
    NLog.log("Parssing Process Start", buff)

    let size = buff.length;
    for (let i = 0; i < size; i++) {
      if (buff[i] === CONST.PK_STX) {
        // 패킷 시작
        this.mBuffer = new ByteUtil();

        this.IsEscape = false;
      } else if (buff[i] === CONST.PK_ETX) {

        // 패킷 끝
        let builder = new PacketBuilder();

        let cmd = this.mBuffer.GetByte();

        // event command is 0x6X and PDS 0x73
        let result_size = cmd >> 4 !== 0x6 && cmd !== 0x73 && cmd !== 0x24 ? 1 : 0;
        let result = result_size > 0 ? this.mBuffer.GetByte() : -1;

        let length = this.mBuffer.GetShort();

        let data = this.mBuffer.GetBytes();

        builder
          .cmd(cmd)
          .result(result)
          .data(data)
          .length(length);

        this.mBuffer.Clear();
        this.mBuffer = null;
        const packet = builder.Build();
        this.ParsePacket(packet);

        this.IsEscape = false;
      } else if (buff[i] === CONST.PK_DLE) {
        if (i < size - 1) {
          this.mBuffer.Put(buff[++i] ^ 0x20);
        } else {
          this.IsEscape = true;
        }
      } else if (this.IsEscape) {
        this.mBuffer.Put(buff[i] ^ 0x20);

        this.IsEscape = false;
      } else {
        this.mBuffer.Put(buff[i]);
      }
    }
  }

  // TODO: 
  ResponseChunkRequest(offset: number, isEnd: boolean) {
    console.log("TODO")
  }

  /**
   * 패킷 내 실데이터 값으로 패킷의 시작, 끝 값인 STX, ETX가 포함되어 있을 때 escape 처리를 위한 함수
   * @param {number} input 
   * @returns {array}
   */
  Escape(input: number) {
    if (input === CONST.PK_STX || input === CONST.PK_ETX || input === CONST.PK_DLE) {
      return [CONST.PK_DLE, input ^ 0x20];
    } else {
      return [input];
    }
  }

  // Send Dot
  ProcessDot(dot: Dot) {
    // this.dotFilter.put(dot)
    this.SendDotReceiveEvent(dot);
  }

  /**
   * 세팅된 도트가 그려지기 위해 펜 콘트롤러의 onDot로 전달하는 함수
   * - 해당 함수가 기능하기 위해서는 onDot를 구현해야 한다.
   * @param {Dot} dot 
   */
  SendDotReceiveEvent = (dot: Dot) => {
    // NLog.log(dot);
    if (this.penController.onDot) {
      this.penController.onDot(this.penController, dot);
    }else{
      NLog.log("Need onDot Callback")
    }
  }

  dotFilter = new DotFilter(this.SendDotReceiveEvent)

  // Send to Pen
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
