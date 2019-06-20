import ByteUtil from "../Util/ByteUtil";
import * as Packet from "./packet";
import Converter from "../Util/Converter";
import Dot, { DotBuilder } from "../API/Dot";
import CMD from "./CMD";
import CONST from "./Const";
import * as Res from "../Model/Response";
import PenMessageType, {
  SettingType,
  PenTipType,
  ErrorType
} from "../API/PenMessageType";

export default class PenClientParserV2 {
  constructor(penController) {
    this.PenController = penController;
    this.const = Object.freeze({
      SupportedProtocolVersion: "2.12",
      PEN_PROFILE_SUPPORT_PROTOCOL_VERSION: 2.1,
      DEFAULT_PASSWORD: "0000"
    });

    this.state = {
      first: true,
      versionInfo: null,
      mTime: -1,
      mPenTipType: -1,
      mPenTipColor: -1,
      IsStartWithDown: false,
      mDotCount: -1,
      mCurSection: -1,
      mCurOwner: -1,
      mCurNote: -1,
      mCurPage: -1,
      PenMaxForce: 0,
      reCheckPassword: false,
      newPassword: null,
      HoverMode: false,
      mPrevDot: null,
      IsBeforeMiddle: false,
      IsStartWithPaperInfo: false,
      IsDownCreated: false,
      SessionTs: -1,
      EventCount: -1
    };

    this.offlineStroke = {};
    this.mBuffer = null;
    this.IsEscape = false;
    this.offline = {
      mTotalOfflineStroke: -1,
      mReceivedOfflineStroke: 0,
      mTotalOfflineDataSize: -1
    };
  }

  ParsePacket(packet) {
    let cmd = packet.Cmd;
    if (packet.Result > 0) {
      console.log("packet result failed");
    }

    switch (cmd) {
      case CMD.VERSION_RESPONSE:
        let versionInfo = Res.VersionInfo(packet);
        this.state.versionInfo = versionInfo;
        this.IsUploading = false;
        this.state.EventCount = 0;
        console.log("ParsePacket Version Info", versionInfo);
        this.ReqPenStatus();
        break;

      case CMD.SHUTDOWN_EVENT:
        let reason = packet.GetByte();
        console.log("ParsePacket power off", reason);
        this.PenController.onMessage(PenMessageType.EVENT_POWER_OFF, {
          reason
        });
        break;

      case CMD.LOW_BATTERY_EVENT:
        let battery = packet.GetByte();
        this.PenController.onMessage(PenMessageType.EVENT_LOW_BATTERY, {
          Battery: battery
        });
        break;

      case CMD.ONLINE_PEN_UPDOWN_EVENT:
      case CMD.ONLINE_PEN_DOT_EVENT:
      case CMD.ONLINE_PAPER_INFO_EVENT:
      case CMD.ONLINE_PEN_ERROR_EVENT:
      case CMD.ONLINE_NEW_PEN_DOWN_EVENT:
      case CMD.ONLINE_NEW_PEN_UP_EVENT:
      case CMD.ONLINE_NEW_PEN_DOT_EVENT:
      case CMD.ONLINE_NEW_PAPER_INFO_EVENT:
      case CMD.ONLINE_NEW_PEN_ERROR_EVENT:
        this.ParseDotPacket(cmd, packet);
        break;

      case CMD.SETTING_INFO_RESPONSE:
        let settingInfo = Res.SettingInfo(packet);
        console.log(
          "ParsePacket SETTING_INFO_RESPONSE",
          settingInfo,
          this.state.first
        );

        // 최초 연결시
        if (this.state.first) {
          this.state.first = false;
          this.PenController.onMessage(
            PenMessageType.PEN_SETTING_INFO,
            settingInfo
          );

          if (settingInfo.Locked) {
            this.PenController.onMessage(PenMessageType.PEN_PASSWORD_REQUEST, {
              RetryCount: settingInfo.RetryCount,
              ResetCount: settingInfo.ResetCount
            });
          } else {
            this.PenController.onMessage(PenMessageType.PEN_AUTHORIZED);
          }
        } else {
          this.PenController.onMessage(
            PenMessageType.PEN_SETTING_INFO,
            settingInfo
          );
        }
        break;

      case CMD.SETTING_CHANGE_RESPONSE:
        let result = Res.SettingChnage(packet);
        this.PenController.onMessage(PenMessageType.PEN_SETUP_SUCCESS, result);
        break;

      // password
      case CMD.PASSWORD_RESPONSE:
        let password = Res.Password(packet);
        console.log("ParsePacket PASSWORD_RESPONSE", password);
        if (password.status === 1) {
          if (this.state.reCheckPassword) {
            this.PenController.onMessage(
              PenMessageType.PEN_SETTING_INFO,
              password
            )
            this.state.reCheckPassword = false;
            break;
          }
          this.PenController.onMessage(PenMessageType.PEN_AUTHORIZED);
        } else {
          if (this.state.reCheckPassword) {
            this.state.reCheckPassword = false;
            this.PenController.onMessage(PenMessageType.PASSWORD_SETUP_FAILURE);
          } else {
            this.PenController.onMessage(
              PenMessageType.PEN_PASSWORD_REQUEST,
              password
            );
          }
        }
        break;
      case CMD.PASSWORD_CHANGE_RESPONSE:
        let passwordChange = Res.PasswordChange(packet);

        if (packet.Result === 0x00) {
          this.state.reCheckPassword = true;
          this.ReqInputPassword(this.state.newPassword);
        } else {
          this.state.newPassword = "";
          this.PenController.onMessage(
            PenMessageType.PASSWORD_SETUP_FAILURE,
            passwordChange
          );
        }
        break;
      //
      // Offline Response
      //
      case CMD.OFFLINE_NOTE_LIST_RESPONSE:
        {
          let length = packet.GetShort();

          let result = {};

          for (var i = 0; i < length; i++) {
            let rb = packet.GetBytes(4);

            let section = parseInt(rb[3] & 0xff);
            let owner = (rb[0] << 24) | (rb[1] << 16) | (rb[2] << 8) | 0x00;
            let note = packet.GetInt();

            result.push({ Section: section, Owner: owner, Note: note });
          }
          this.PenController.onMessage(PenMessageType.OFFLINE_DATA_NOTE_LIST, {
            OfflineNotes: result
          });
        }
        break;
      case CMD.OFFLINE_PAGE_LIST_RESPONSE:
        {
          let rb = packet.GetBytes(4);

          let section = parseInt(rb[3] & 0xff);
          let owner = (rb[0] << 24) | (rb[1] << 16) | (rb[2] << 8) | 0x00;
          let note = packet.GetInt();

          let length = packet.GetShort();

          let pages = {};

          for (let i = 0; i < length; i++) {
            pages.put(packet.GetInt());
          }

          let info = {
            Section: section,
            Owner: owner,
            Note: note,
            Pages: pages
          };
          this.PenController.onMessage(PenMessageType.OFFLINE_DATA_NOTE_LIST, {
            OfflineNotes: info
          });
        }
        break;
      case CMD.OFFLINE_DATA_RESPONSE:
        {
          this.offline.mTotalOfflineStroke = packet.GetInt();
          this.offline.mReceivedOfflineStroke = 0;
          this.offline.mTotalOfflineDataSize = packet.GetInt();

          let isCompressed = packet.GetByte() === 1;
          console.log("isCompressed", isCompressed);
          this.PenController.onMessage(PenMessageType.OFFLINE_DATA_SEND_START);
        }
        break;

      case CMD.OFFLINE_PACKET_REQUEST:
        // skip because zip library
        break;

      case CMD.OFFLINE_DATA_DELETE_RESPONSE:
        this.PenController.onMessage(
          PenMessageType.OFFLINE_DATA_DELETE_RESPONSE,
          { Result: packet.Result === 0x00 }
        );
        break;

      //
      // Firmware Response
      //
      case CMD.FIRMWARE_UPLOAD_RESPONSE:
        if (packet.Result !== 0 || packet.GetByteToInt() !== 0) {
          this.IsUploading = false;
          this.PenController.onMessage(PenMessageType.PEN_FW_UPGRADE_SUCCESS, {
            Result: false
          });
        }
        break;

      case CMD.FIRMWARE_PACKET_REQUEST:
        {
          let status = packet.GetByteToInt();
          let offset = packet.GetInt();

          this.ResponseChunkRequest(offset, status !== 3);
        }
        break;

      case CMD.ONLINE_DATA_RESPONSE:
        console.log("Using Note Set", packet.result);
        this.ReqSetupTime()
        break;
      case CMD.RES_PDS:
        let pds = Res.PDS(packet);
        this.PenController.onMessage(PenMessageType.RES_PDS, pds);
        break;

      default:
        console.log("ParsePacket: not implemented yet", packet);
        break;
    }
  }

  CheckEventCount(ecount) {
    //Debug.WriteLine("COUNT : " + ecount + ", " + EventCount);

    if (
      ecount - this.state.EventCount !== 1 &&
      (ecount !== 0 || this.state.EventCount !== 255)
    ) {
      let errorDot = null;

      if (this.state.mPrevDot != null) {
        errorDot = this.state.mPrevDot.Clone();
        errorDot.DotType = Dot.DotTypes.PEN_ERROR;
      }

      if (ecount - this.state.EventCount > 1) {
        let extraData =
          "missed event count " +
          (this.state.EventCount + 1) +
          "-" +
          (ecount - 1);
        this.PenController.onErrorDetected({
          ErrorType: ErrorType.InvalidEventCount,
          Dot: errorDot,
          Timestamp: this.state.SessionTs,
          ExtraData: extraData
        });
      } else if (ecount < this.state.EventCount) {
        let extraData =
          "invalid event count " + this.state.EventCount + "," + ecount;
        this.PenController.onErrorDetected({
          ErrorType: ErrorType.InvalidEventCount,
          Dot: errorDot,
          Timestamp: this.state.SessionTs,
          ExtraData: extraData
        });
      }
    }

    this.state.EventCount = ecount;
  }

  ParseDotPacket(cmd, pk) {
    // console.log("ParseDotPacket", cmd, pk);

    switch (cmd) {
      case CMD.ONLINE_NEW_PEN_DOWN_EVENT:
        {
          if (
            this.state.IsStartWithDown &&
            this.state.IsBeforeMiddle &&
            this.state.mPrevDot !== null
          ) {
            this.MakeUpDot();
          }

          let ecount = pk.GetByteToInt();

          this.CheckEventCount(ecount);

          this.state.IsStartWithDown = true;

          this.state.mTime = pk.GetLong();

          this.state.SessionTs = this.state.mTime;

          this.state.IsBeforeMiddle = false;
          this.state.IsStartWithPaperInfo = false;

          this.state.IsStartWithPaperInfo = false;

          this.state.mDotCount = 0;

          this.state.mPenTipType =
            pk.GetByte() === 0x00 ? PenTipType.Normal : PenTipType.Eraser;
          this.state.mPenTipColor = pk.GetInt();

          this.state.mPrevDot = null;
        }
        break;

      case CMD.ONLINE_NEW_PEN_UP_EVENT:
        {
          //UpDotTimerStop();

          let ecount = pk.GetByteToInt();

          this.CheckEventCount(ecount);

          let timestamp = pk.GetLong();
          new Date(timestamp)
          // console.log("ONLINE_NEW_PEN_UP_EVENT timestamp", new Date(timestamp));
          let dotCount = pk.GetShort();
          let totalImageCount = pk.GetShort();
          let procImageCount = pk.GetShort();
          let succImageCount = pk.GetShort();
          let sendImageCount = pk.GetShort();

          if (
            this.state.IsStartWithDown &&
            this.state.IsBeforeMiddle &&
            this.state.mPrevDot !== null
          ) {
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
          } else if (
            !this.state.IsStartWithDown &&
            !this.state.IsBeforeMiddle
          ) {
            // 즉 다운업(무브없이) 혹은 업만 들어올 경우 UP dot을 보내지 않음
            this.PenController.onErrorDetected({
              ErrorType: ErrorType.MissingPenDownPenMove,
              Timestamp: -1
            });
          } else if (!this.state.IsBeforeMiddle) {
            // 무브없이 다운-업만 들어올 경우 UP dot을 보내지 않음
            this.PenController.onErrorDetected({
              ErrorType: ErrorType.MissingPenMove,
              Timestamp: this.state.SessionTs
            });
          }

          this.state.mTime = -1;
          this.state.SessionTs = -1;

          this.state.IsStartWithDown = false;
          this.state.IsBeforeMiddle = false;
          this.state.IsStartWithPaperInfo = false;
          this.state.IsStartWithPaperInfo = false;

          this.state.mDotCount = 0;

          this.state.mPrevDot = null;
        }
        break;

      case CMD.ONLINE_PEN_UPDOWN_EVENT:
        {
          let IsDown = pk.GetByte() === 0x00;

          if (IsDown) {
            if (
              this.state.IsStartWithDown &&
              this.state.IsBeforeMiddle &&
              this.state.mPrevDot !== null
            ) {
              // 펜업이 넘어오지 않음
              //var errorDot = state.mPrevDot.Clone();
              //errorDot.DotType = DotTypes.PEN_ERROR;
              //PenController.onErrorDetected(new ErrorDetectedEventArgs(ErrorType.MissingPenUp, errorDot, state.SessionTs));

              this.MakeUpDot();
            }

            this.state.IsStartWithDown = true;

            this.state.mTime = pk.GetLong();

            this.state.SessionTs = this.state.mTime;
          } else {
            if (
              this.state.IsStartWithDown &&
              this.state.IsBeforeMiddle &&
              this.state.mPrevDot !== null
            ) {
              this.MakeUpDot(false);
            } else if (
              !this.state.IsStartWithDown &&
              !this.state.IsBeforeMiddle
            ) {
              // 즉 다운업(무브없이) 혹은 업만 들어올 경우 UP dot을 보내지 않음
              this.PenController.onErrorDetected({
                ErrorType: ErrorType.MissingPenDownPenMove,
                Timestamp: -1
              });
            } else if (!this.state.IsBeforeMiddle) {
              // 무브없이 다운-업만 들어올 경우 UP dot을 보내지 않음
              this.PenController.onErrorDetected({
                ErrorType: ErrorType.MissingPenMove,
                Timestamp: this.state.SessionTs
              });
            }

            this.state.IsStartWithDown = false;

            this.state.mTime = -1;

            this.state.SessionTs = -1;
          }

          this.state.IsBeforeMiddle = false;
          this.state.IsStartWithPaperInfo = false;
          this.state.IsStartWithPaperInfo = false;

          this.state.mDotCount = 0;

          this.state.mPenTipType =
            pk.GetByte() === 0x00 ? PenTipType.Normal : PenTipType.Eraser;
          this.state.mPenTipColor = pk.GetInt();

          this.state.mPrevDot = null;
        }
        break;

      case CMD.ONLINE_PEN_DOT_EVENT:
      case CMD.ONLINE_NEW_PEN_DOT_EVENT:
        this.PenDotEvent(cmd, pk);
        break;
      case CMD.ONLINE_PAPER_INFO_EVENT:
      case CMD.ONLINE_NEW_PAPER_INFO_EVENT:
        this.PaperInfoEvent(cmd, pk);
        break;

      case CMD.ONLINE_PEN_ERROR_EVENT:
      case CMD.ONLINE_NEW_PEN_ERROR_EVENT:
        {
          /*
					if (cmd == Cmd.ONLINE_NEW_PEN_ERROR_EVENT)
					{
						upDotTimer.Change(UPDOT_TIMEOUT, Timeout.Infinite);
					}
					*/
          if (cmd === CMD.ONLINE_NEW_PEN_ERROR_EVENT) {
            let ecount = pk.GetByteToInt();

            this.CheckEventCount(ecount);
          }

          let timeadd = pk.GetByteToInt();
          this.state.mTime += timeadd;

          let force = pk.GetShort();
          let brightness = pk.GetByteToInt();
          let exposureTime = pk.GetByteToInt();
          let ndacProcessTime = pk.GetByteToInt();
          let labelCount = pk.GetShort();
          let ndacErrorCode = pk.GetByteToInt();
          let classType = pk.GetByteToInt();
          let errorCount = pk.GetByteToInt();

          let newInfo = {
            Timestamp: this.state.mTime,
            Force: force,
            Brightness: brightness,
            ExposureTime: exposureTime,
            ProcessTime: ndacProcessTime,
            LabelCount: labelCount,
            ErrorCode: ndacErrorCode,
            ClassType: classType,
            ErrorCount: errorCount
          };

          let errorDot = null;

          if (this.state.mPrevDot != null) {
            errorDot = this.state.mPrevDot.Clone();
            errorDot.DotType = Dot.DotTypes.PEN_UP;
          }

          this.PenController.onErrorDetected({
            ErrorType: ErrorType.ImageProcessingError,
            Dot: errorDot,
            Timestamp: this.state.SessionTs,
            ImageProcessErrorInfo: newInfo
          });
        }
        break;
      default:
        console.log("undefined");
    }
  }

  PaperInfoEvent(cmd, pk) {
    if (
      cmd === CMD.ONLINE_NEW_PAPER_INFO_EVENT ||
      cmd === CMD.ONLINE_ENCRYPTION_PAPER_INFO_EVENT
    ) {
      let ecount = pk.GetByteToInt();

      this.CheckEventCount(ecount);
    }

    // 미들도트 중에 페이지가 바뀐다면 강제로 펜업을 만들어 준다.
    if (
      this.state.IsStartWithDown &&
      this.state.IsBeforeMiddle &&
      this.state.mPrevDot !== null
    ) {
      this.MakeUpDot(false);
    }

    let rb = pk.GetBytes(4);

    this.state.mCurSection = rb[3] & 0xff;
    this.state.mCurOwner = Converter.byteArrayToInt([
      rb[0],
      rb[1],
      rb[2],
      0x00
    ]);
    this.state.mCurNote = pk.GetInt();
    this.state.mCurPage = pk.GetInt();

    this.state.mDotCount = 0;

    this.state.IsStartWithPaperInfo = true;
  }

  PenDotEvent(cmd, pk) {
    if (
      cmd === CMD.ONLINE_NEW_PEN_DOT_EVENT ||
      cmd === CMD.ONLINE_ENCRYPTION_PEN_DOT_EVENT
    ) {
      let ecount = pk.GetByteToInt();

      this.CheckEventCount(ecount);
    }

    let timeadd = pk.GetByte();

    this.state.mTime += timeadd;

    let force = pk.GetShort();

    let x = pk.GetShort();
    let y = pk.GetShort();

    let fx = pk.GetByte();
    let fy = pk.GetByte();

    let dot = null;

    if (!this.state.HoverMode && !this.state.IsStartWithDown) {
      if (!this.state.IsStartWithPaperInfo) {
        //펜 다운 없이 페이퍼 정보 없고 무브가 오는 현상(다운 - 무브 - 업 - 다운X - 무브)
        this.PenController.onErrorDetected({
          ErrorType: ErrorType.MissingPenDown,
          Timestamp: -1
        });
      } else {
        this.state.mTime = Date.now();

        this.state.SessionTs = this.state.mTime;

        let errorDot = this.MakeDot(
          this.state.PenMaxForce,
          this.state.mCurOwner,
          this.state.mCurSection,
          this.state.mCurNote,
          this.state.mCurPage,
          this.state.mTime,
          x,
          y,
          fx,
          fy,
          force,
          Dot.DotTypes.PEN_ERROR,
          this.state.mPenTipColor
        );

        //펜 다운 없이 페이퍼 정보 있고 무브가 오는 현상(다운 - 무브 - 업 - 다운X - 무브)
        this.PenController.onErrorDetected({
          ErrorType: ErrorType.MissingPenDown,
          Dot: errorDot,
          Timestamp: this.state.SessionTs
        });

        this.state.IsStartWithDown = true;
        this.state.IsStartWithPaperInfo = true;
      }
    }

    if (
      this.state.HoverMode &&
      !this.state.IsStartWithDown &&
      this.state.IsStartWithPaperInfo
    ) {
      dot = this.MakeDot(
        this.state.PenMaxForce,
        this.state.mCurOwner,
        this.state.mCurSection,
        this.state.mCurNote,
        this.state.mCurPage,
        this.state.mTime,
        x,
        y,
        fx,
        fy,
        force,
        Dot.DotTypes.PEN_HOVER,
        this.state.mPenTipColor
      );
    } else if (this.state.IsStartWithDown) {
      if (this.state.IsStartWithPaperInfo) {
        dot = this.MakeDot(
          this.state.PenMaxForce,
          this.state.mCurOwner,
          this.state.mCurSection,
          this.state.mCurNote,
          this.state.mCurPage,
          this.state.mTime,
          x,
          y,
          fx,
          fy,
          force,
          this.state.mDotCount === 0
            ? Dot.DotTypes.PEN_DOWN
            : Dot.DotTypes.PEN_MOVE,
          this.state.mPenTipColor
        );
      } else {
        //펜 다운 이후 페이지 체인지 없이 도트가 들어왔을 경우
        this.PenController.onErrorDetected({
          ErrorType: ErrorType.MissingPageChange,
          Timestamp: this.state.SessionTs
        });
      }
    }

    if (dot != null) {
      this.ProcessDot(dot, null);
      /*
			if (cmd == Cmd.ONLINE_NEW_PEN_DOT_EVENT)
			{
				upDotTimer.Change(UPDOT_TIMEOUT, Timeout.Infinite);
			}
			*/
    }

    this.state.IsBeforeMiddle = true;
    this.state.mPrevDot = dot;
    this.state.mDotCount++;
  }

  OnDisconnected() {
    if (
      this.state.IsStartWithDown &&
      this.state.IsBeforeMiddle &&
      this.state.mPrevDot !== null
    ) {
      this.MakeUpDot();

      this.state.mTime = -1;
      this.state.SessionTs = -1;

      this.state.IsStartWithDown = false;
      this.state.IsBeforeMiddle = false;
      this.state.IsStartWithPaperInfo = false;

      this.state.mDotCount = 0;

      this.state.mPrevDot = null;
    }
  }

  ProcessDot(dot, obj) {
    //dotFilterForPaper.Put(dot, obj);
    this.SendDotReceiveEvent(dot, obj);
  }

  SendDotReceiveEvent(dot, obj) {
    // console.log(dot);
    this.PenController.onDot({ Dot: dot, ImageProcessingInfo: obj });
  }

  AddOfflineFilteredDot(dot, obj) {
    this.offlineStroke.push(dot);
  }

  ParseDot(mPack, type) {
    let timeadd = mPack.GetByte();

    this.state.mTime += timeadd;

    let force = mPack.GetShort();

    let x = mPack.GetShort();
    let y = mPack.GetShort();

    let fx = mPack.GetByte();
    let fy = mPack.GetByte();

    // let tx = mPack.GetByte();
    // let ty = mPack.GetByte();
    // let twist = mPack.GetShort();

    this.ProcessDot(
      this.MakeDot(
        this.state.PenMaxForce,
        this.state.mCurOwner,
        this.state.mCurSection,
        this.state.mCurNote,
        this.state.mCurPage,
        this.state.mTime,
        x,
        y,
        fx,
        fy,
        force,
        type,
        this.state.mPenTipColor
      ),
      null
    );
    //PenController.onReceiveDot(new DotReceivedEventArgs(MakeDot(state.PenMaxForce, state.mCurOwner, mCurSection, state.mCurNote, state.mCurPage, state.mTime, x, y, fx, fy, force, type, state.mPenTipColor)));
  }

  UpDotTimerCallback() {
    console.log("UpDotTimerCallback");

    if (
      this.state.IsStartWithDown &&
      this.state.IsBeforeMiddle &&
      this.state.mPrevDot !== null
    ) {
      this.MakeUpDot();

      this.state.mTime = -1;
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
      this.PenController.onErrorDetected({
        ErrorType: ErrorType.MissingPenUp,
        Dot: errorDot,
        Timestamp: this.state.SessionTs
      });
    }

    let audot = this.state.mPrevDot.Clone();
    audot.DotType = Dot.DotTypes.PEN_UP;
    this.ProcessDot(audot, null);
  }

  Escape(input) {
    if (
      input === CONST.PK_STX ||
      input === CONST.PK_ETX ||
      input === CONST.PK_DLE
    ) {
      return [CONST.PK_DLE, input ^ 0x20];
    } else {
      return [input];
    }
  }

  Send(bf) {
    this.PenController.handleWrite(new Buffer(new Uint8Array(bf.ToArray())));
    bf = {};
    return true;
  }

  //
  // Request
  //
  ReqVersion() {
    let bf = new ByteUtil(this.Escape.bind(this));

    // TODO 정상적으로 넘어오는지 확인이 필요하다.
    let StrAppVersion = Converter.toUTF8Array("0.0.0.0");
    let StrProtocolVersion = Converter.toUTF8Array(
      this.const.SupportedProtocolVersion
    );

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

  ReqVersionTask() {
    // TODO make thread for try 3times
    this.state.first = true;
    setTimeout(() => this.ReqVersion(), 500);
  }

  //
  // Password
  //
  ReqSetUpPassword(oldPassword, newPassword = "") {
    if (!oldPassword || !newPassword) return false;
    console.log("ReqSetUpPassword", oldPassword, newPassword)
    // if (oldPassword === this.const.DEFAULT_PASSWORD) return false;
    if (newPassword === this.const.DEFAULT_PASSWORD) return false;

    this.state.newPassword = newPassword;

    let oPassByte = Converter.toUTF8Array(oldPassword);
    let nPassByte = Converter.toUTF8Array(newPassword);

    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.PASSWORD_CHANGE_REQUEST)
      .PutShort(33)
      .Put(newPassword === "" ? 0 : 1)
      .PutArray(oPassByte, 16)
      .PutArray(nPassByte, 16)
      .Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  ReqInputPassword(password) {
    if (!password) return false;
    if (password === this.const.DEFAULT_PASSWORD) return false;

    let bStrByte = Converter.toUTF8Array(password);

    let bf = new ByteUtil(this.Escape.bind(this));
    bf.Put(CONST.PK_STX, false)
      .Put(CMD.PASSWORD_REQUEST)
      .PutShort(16)
      .PutArray(bStrByte, 16)
      .Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  ReqPenStatus() {
    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.SETTING_INFO_REQUEST)
      .PutShort(0)
      .Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  RequestChangeSetting(stype, value) {
    let bf = new ByteUtil(this.Escape.bind(this));

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
          .PutArray(nBytes.buffer, 4);

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
        console.log("undefined setting type");
    }

    bf.Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  ReqSetupTime() {
    let timetick = Date.now()
    // console.log("Setup Time", timetick, new Date(timetick));
    return this.RequestChangeSetting(SettingType.Timestamp, timetick);
  }

  ReqSetupPenAutoShutdownTime(minute) {
    return this.RequestChangeSetting(SettingType.AutoPowerOffTime, minute);
  }

  ReqSetupPenCapPower(enable) {
    return this.RequestChangeSetting(SettingType.PenCapOff, enable);
  }

  ReqSetupPenAutoPowerOn(enable) {
    return this.RequestChangeSetting(SettingType.AutoPowerOn, enable);
  }

  ReqSetupPenBeep(enable) {
    return this.RequestChangeSetting(SettingType.Beep, enable);
  }

  ReqSetupHoverMode(enable) {
    return this.RequestChangeSetting(SettingType.Hover, enable);
  }

  ReqSetupOfflineData(enable) {
    return this.RequestChangeSetting(SettingType.OfflineData, enable);
  }

  ReqSetupPenColor(enable) {
    return this.RequestChangeSetting(SettingType.LedColor, enable);
  }

  ReqSetupPenSensitivity(step) {
    return this.RequestChangeSetting(SettingType.Sensitivity, step);
  }

  ReqSetupUsbMode(mode) {
    return this.RequestChangeSetting(SettingType.UsbMode, mode);
  }

  ReqSetupDownSampling(enable) {
    return this.RequestChangeSetting(SettingType.DownSampling, enable);
  }

  ReqSetupBtLocalName(btLocalName) {
    return this.RequestChangeSetting(SettingType.BtLocalName, btLocalName);
  }

  ReqSetupPenFscSensitivity(step) {
    return this.RequestChangeSetting(SettingType.FscSensitivity, step);
  }

  ReqSetupDataTransmissionType(type) {
    return this.RequestChangeSetting(SettingType.DataTransmissionType, type);
  }

  ReqBeepAndLight() {
    return this.RequestChangeSetting(SettingType.BeepAndLight);
  }

  IsSupportPenProfile() {
    let temp = this.state.VersionInfo.ProtocolVersion.split(".");
    let tempVer = "";
    if (temp.length === 1) tempVer += temp[0];
    else if (temp.length >= 2) tempVer += temp[0] + "." + temp[1];

    let ver = parseFloat(tempVer);

    return ver >= this.const.PEN_PROFILE_SUPPORT_PROTOCOL_VERSION;
  }

  /**
  * Returns the sum of a and b
  * @param {array} sectionIds
  * @param {array} ownerIds
  * @param {array} noteIds
  * @returns {boolean}
  */
  ReqAddUsingNotes(sectionIds, ownerIds, noteIds) {
    let bf = new ByteUtil(this.Escape.bind(this));
    bf.Put(CONST.PK_STX, false).Put(CMD.ONLINE_DATA_REQUEST);

    if (noteIds) {

      let length = 2 + noteIds.Length * 8;

      bf.PutShort(length).PutShort(noteIds.Length);
      noteIds.foreach( (item, index) => {
        bf.Put(this.GetSectionOwnerByte(sectionIds[index], ownerIds[index])).PutInt(item);
      });

    } else if ( sectionIds && ownerIds) {
      bf.PutShort(2 + 8 * sectionIds.length)
      .PutShort(sectionIds.length)
      sectionIds.foreach( (section, index) => {
        bf.Put(this.GetSectionOwnerByte(section, ownerIds[index])).PutInt(0xffffffff);
      });

    } else {
      bf.PutShort(2).Put(0xff).Put(0xff);
    }

    bf.Put(CONST.PK_ETX, false);
    return this.Send(bf);
  }

  //
  // Offline Data
  //
  ReqOfflineDataList(section, owner, note) {
    if (note) {
      let bf = new ByteUtil(this.Escape.bind(this));

      bf.Put(CONST.PK_STX, false)
        .Put(CMD.OFFLINE_PAGE_LIST_REQUEST)
        .PutShort(8)
        .Put(this.GetSectionOwnerByte(section, owner))
        .PutInt(note)
        .Put(CONST.PK_ETX, false);

      return this.Send(bf);
    } else {
      let bf = new ByteUtil(this.Escape.bind(this));

      let pInfo =
        section > 0 && owner > 0
          ? this.GetSectionOwnerByte(section, owner)
          : new Uint8Array([0xff, 0xff, 0xff, 0xff]).buffer;

      bf.Put(CONST.PK_STX, false)
        .Put(CMD.OFFLINE_NOTE_LIST_REQUEST)
        .PutShort(4)
        .Put(pInfo)
        .Put(CONST.PK_ETX, false);

      return this.Send(bf);
    }
  }

  ReqOfflineData(section, owner, note, deleteOnFinished = true, pages = null) {
    let ownerByte = Converter.intToByteArray(owner);
    console.log("ReqOfflineData ownerByte", ownerByte);
    let length = 14;

    length += pages == null ? 0 : pages.Length * 4;

    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.OFFLINE_DATA_REQUEST)
      .PutShort(length)
      .Put(deleteOnFinished ? 1 : 2)
      .Put(0x01)
      .Put(this.GetSectionOwnerByte(section, owner))
      .PutInt(note)
      .PutInt(pages == null ? 0 : pages.Length);

    if (pages != null) {
      pages.foreach(page => {
        bf.PutInt(page);
      });
    }

    bf.Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  SendOfflinePacketResponse(index, isSuccess = true) {
    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(CONST.PK_STX, false)
      .Put(CMD.OFFLINE_PACKET_RESPONSE)
      .Put(isSuccess ? 0 : 1)
      .PutShort(3)
      .PutShort(index)
      .Put(1)
      .Put(CONST.PK_ETX, false);

    this.Send(bf);
  }

  ReqRemoveOfflineData(section, owner, notes) {
    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(CONST.PK_STX, false).Put(CMD.OFFLINE_DATA_DELETE_REQUEST);

    let length = 5 + notes.Length * 4;

    bf.PutShort(length)
      .Put(this.GetSectionOwnerByte(section, owner))
      .Put(notes.Length);
    notes.foreach(noteId => {
      bf.PutInt(noteId);
    });

    bf.Put(CONST.PK_ETX, false);

    return this.Send(bf);
  }

  //
  // Firmware
  //

  GetSectionOwnerByte(section, owner) {
    let ownerByte = Converter.intToByteArray(owner);
    ownerByte[3] = section & 0xff;

    return ownerByte;
  }

  //public Dot(
  MakeDot(
    penMaxForce,
    owner,
    section,
    note,
    page,
    timestamp,
    x,
    y,
    fx,
    fy,
    force,
    type,
    color
  ) {
    let builder = null;
    if (penMaxForce === 0) builder = new DotBuilder();
    else builder = new DotBuilder(penMaxForce);

    builder
      .owner(owner)
      .section(section)
      .note(note)
      .page(page)
      .timestamp(timestamp)
      .coord(x + fx * 0.01, y + fy * 0.01)
      .force(force)
      .dotType(type)
      .color(color);
    return builder.Build();
  }

  /**
   * Step3 Sand Data from Pen
   * @param {array} buff - uint8array
   */
  ProtocolParse(buff) {
    let size = buff.length;
    for (let i = 0; i < size; i++) {
      if (buff[i] === CONST.PK_STX) {
        // 패킷 시작
        this.mBuffer = new ByteUtil();

        this.IsEscape = false;
      } else if (buff[i] === CONST.PK_ETX) {
        // 패킷 끝
        let builder = new Packet.PacketBuilder();

        let cmd = this.mBuffer.GetByteToInt();

        // event command is 0x6X and PDS 0x73
        let result_size = cmd >> 4 !== 0x6 && cmd !== 0x73 ? 1 : 0;
        let result = result_size > 0 ? this.mBuffer.GetByteToInt() : -1;

        let length = this.mBuffer.GetShort();

        let data = this.mBuffer.GetBytes();

        builder
          .cmd(cmd)
          .result(result)
          .data(data)
          .length(length);

        this.mBuffer.Clear();
        this.mBuffer = null;

        this.ParsePacket(builder.Build());

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
}
