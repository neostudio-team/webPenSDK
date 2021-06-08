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
  ParsePacket(packet: Packet) {
    let cmd = packet.Cmd;
    // NLog.log("ParsePacket", cmd, "0x" + cmd.toString(16))
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
        let settingChangeResult = Res.SettingChnage(packet);
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

  CheckEventCount(ecount: number) {
    //Debug.WriteLine("COUNT : " + ecount + ", " + EventCount);

    if (ecount - this.state.EventCount !== 1 && (ecount !== 0 || this.state.EventCount !== 255)) {
      let errorDot = null;

      if (this.state.mPrevDot != null) {
        errorDot = this.state.mPrevDot.Clone();
        errorDot.DotType = Dot.DotTypes.PEN_ERROR;
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
      udot.DotType = Dot.DotTypes.PEN_UP;
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
      this.ProcessDot(udot, imageInfo);
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
      errorDot.DotType = Dot.DotTypes.PEN_UP;
    }
    this.penController.onErrorDetected({
      ErrorType: ErrorType.ImageProcessingError,
      Dot: errorDot,
      Timestamp: this.state.SessionTs,
      ImageProcessErrorInfo: newInfo
    });
  }

  // MARK: Parse Paper
  PaperInfoEvent(cmd: number, pk: Packet) {
    if (cmd === CMD.ONLINE_NEW_PAPER_INFO_EVENT || cmd === CMD.ONLINE_ENCRYPTION_PAPER_INFO_EVENT) {
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
  PenDotEvent(cmd: number, pk: Packet) {
    if (cmd === CMD.ONLINE_NEW_PEN_DOT_EVENT || cmd === CMD.ONLINE_ENCRYPTION_PEN_DOT_EVENT) {
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

    if (this.penSettingInfo.HoverMode && !this.state.IsStartWithDown && this.state.IsStartWithPaperInfo) {
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
      this.ProcessDot(dot, null);
    }

    this.state.IsBeforeMiddle = true;
    this.state.mPrevDot = dot;
    this.state.mDotCount++;
  }

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

  ProcessDot(dot: Dot, obj: any) {
    //dotFilterForPaper.Put(dot, obj);
    this.SendDotReceiveEvent(dot, obj);
  }

  SendDotReceiveEvent(dot: Dot, obj: any) {
    // NLog.log(dot);
    this.penController.onDot!(this.penController, dot, obj);
  }

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

  MakeUpDot(isError = true) {
    if (isError) {
      let errorDot = this.state.mPrevDot.Clone();
      errorDot.DotType = Dot.DotTypes.PEN_ERROR;
      this.penController.onErrorDetected({
        ErrorType: ErrorType.MissingPenUp,
        Dot: errorDot,
        Timestamp: this.state.SessionTs
      });
    }

    let audot = this.state.mPrevDot.Clone();
    audot.DotType = Dot.DotTypes.PEN_UP;
    this.ProcessDot(audot, null);
  }

  // MARK: Parse Offline
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
  ReqPenStatus() {
    let bf = new ByteUtil();

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.SETTING_INFO_REQUEST)
      .PutShort(0)
      .Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  // NOTE: Request(SetupTime)
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
   * Step3 Sand Data from Pen
   * @param {array} buff - uint8array
   */
  ProtocolParse(buff: Uint8Array) {
    // NLog.log("Parssing Process Start", buff)

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

  Escape(input: number) {
    if (input === CONST.PK_STX || input === CONST.PK_ETX || input === CONST.PK_DLE) {
      return [CONST.PK_DLE, input ^ 0x20];
    } else {
      return [input];
    }
  }

  Send(bf: ByteUtil) {
    const u8 = bf.ToU8Array()
    this.penController.handleWrite!(u8);
    return true;
  }
}
