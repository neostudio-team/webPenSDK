import ByteUtil from "../Util/ByteUtil";
import * as Packet from "./packet";
import Converter from "../Util/Converter";
import Dot, { DotBuilder } from "../Model/Dot";

export default class PenClientParserV2 {
  constructor(penController) {
    this.PenController = penController;
  }

  toHexString(bytes) {
    return bytes
      .map(function(byte) {
        return ("00" + (byte & 0xff).toString(16)).slice(-2);
      })
      .join("");
  }

  ParsePacket(packet) {
    let cmd = packet.Cmd;
    if (packet.Result > 0) {
      console.log("packet result failed");
    }

    switch (cmd) {
      case this.Cmd.VERSION_RESPONSE:
        this.DeviceName = packet.GetString(16);
        this.FirmwareVersion = packet.GetString(16);
        this.ProtocolVersion = packet.GetString(8);
        this.SubName = packet.GetString(16);
        this.DeviceType = packet.GetShort();
        this.MaxForce = -1;
        this.MacAddress = this.toHexString(packet.GetBytes(6));

        let isMG = this.isF121MG(this.MacAddress);
        if (
          isMG &&
          this.DeviceName === this.F121 &&
          this.SubName === "Mbest_smartpenS"
        )
          this.DeviceName = this.F121MG;

        this.IsUploading = false;

        this.EventCount = 0;

        // aesChiper = null;
        // rsaChiper = null;

        this.ReqPenStatus();
        break;
      case this.Cmd.SHUTDOWN_EVENT:
        let reason = packet.GetByte();
        console.log("power off", reason)
        break;
      case this.Cmd.LOW_BATTERY_EVENT:
        let battery = packet.GetByte() & 0xff;
        this.PenController.onReceiveBatteryAlarm({ Battery: battery });
        break;
      case this.Cmd.ONLINE_PEN_UPDOWN_EVENT:
      case this.Cmd.ONLINE_PEN_DOT_EVENT:
      case this.Cmd.ONLINE_PAPER_INFO_EVENT:
      case this.Cmd.ONLINE_PEN_ERROR_EVENT:
      case this.Cmd.ONLINE_NEW_PEN_DOWN_EVENT:
      case this.Cmd.ONLINE_NEW_PEN_UP_EVENT:
      case this.Cmd.ONLINE_NEW_PEN_DOT_EVENT:
      case this.Cmd.ONLINE_NEW_PAPER_INFO_EVENT:
      case this.Cmd.ONLINE_NEW_PEN_ERROR_EVENT:
        this.ParseDotPacket(cmd, packet);
        break;
      case this.Cmd.ONLINE_ENCRYPTION_PAPER_INFO_EVENT:
      case this.Cmd.ONLINE_ENCRYPTION_PEN_DOT_EVENT:
        this.ParseEncryptionDotPacket(cmd, packet);
        break;
      case this.Cmd.SETTING_INFO_RESPONSE:
        {
          // 비밀번호 사용 여부
          let lockyn = packet.GetByteToInt() === 1;

          // 비밀번호 입력 최대 시도 횟수
          let pwdMaxRetryCount = packet.GetByteToInt();

          // 비밀번호 입력 시도 횟수
          let pwdRetryCount = packet.GetByteToInt();

          // 1970년 1월 1일부터 millisecond tick
          let time = packet.GetLong();

          // 사용하지 않을때 자동으로 전원이 종료되는 시간 (단위:분)
          let autoPowerOffTime = packet.GetShort();

          // 최대 필압
          let maxForce = packet.GetShort();

          // 현재 메모리 사용량
          let usedStorage = packet.GetByteToInt();

          // 펜의 뚜껑을 닫아서 펜의 전원을 차단하는 기능 사용 여부
          let penCapOff = packet.GetByteToInt() === 1;

          // 전원이 꺼진 펜에 필기를 시작하면 자동으로 펜의 켜지는 옵션 사용 여부
          let autoPowerON = packet.GetByteToInt() === 1;

          // 사운드 사용여부
          let beep = packet.GetByteToInt() === 1;

          // 호버기능 사용여부
          let hover = packet.GetByteToInt() === 1;

          // 남은 배터리 수치
          let batteryLeft = packet.GetByteToInt();

          // 오프라인 데이터 저장 기능 사용 여부
          let useOffline = packet.GetByteToInt() === 1;

          // 필압 단계 설정 (0~4) 0이 가장 민감
          let fsrStep = packet.GetByteToInt();

          // 최초 연결시
          if (this.MaxForce === -1) {
            this.MaxForce = maxForce;

            this.PenController.onConnected({
              MacAddress: this.MacAddress,
              DeviceName: this.DeviceName,
              FirmwareVersion: this.FirmwareVersion,
              ProtocolVersion: this.ProtocolVersion,
              SubName: this.SubName,
              MaxForce: this.MaxForce
            });
            this.PenMaxForce = this.MaxForce;

            if (lockyn) {
              this.PenController.onPenPasswordRequest({
                RetryCount: pwdRetryCount,
                ResetCount: pwdMaxRetryCount
              });
            } else {
              this.ReqSetupTime(Date.now());
              this.PenController.onPenAuthenticated();
              //AesKeyRequest();
            }
          } else {
            this.PenController.onReceivePenStatus({
              Locked: lockyn,
              PasswordMaxRetryCount: pwdMaxRetryCount,
              PasswordRetryCount: pwdRetryCount,
              Timestamp: time,
              AutoShutdownTime: autoPowerOffTime,
              MaxForce: this.MaxForce,
              Battery: batteryLeft,
              UsedMem: usedStorage,
              UseOfflineData: useOffline,
              AutoPowerOn: autoPowerON,
              PenCapPower: penCapOff,
              HoverMode: hover,
              Beep: beep,
              PenSensitivity: fsrStep
            });
          }
        }
        break;
      case this.Cmd.SETTING_CHANGE_RESPONSE:
        {
          let stype = packet.GetByteToInt();

          let result = packet.Result === 0x00;

          switch (stype) {
            case this.SettingType.AutoPowerOffTime:
              this.PenController.onPenAutoShutdownTimeSetupResponse({
                Result: result
              });
              break;

            case this.SettingType.AutoPowerOn:
              this.PenController.onPenAutoPowerOnSetupResponse({
                Result: result
              });
              break;

            case this.SettingType.Beep:
              this.PenController.onPenBeepSetupResponse({ Result: result });
              break;

            case this.SettingType.Hover:
              this.PenController.onPenHoverSetupResponse({ Result: result });
              break;

            case this.SettingType.LedColor:
              this.PenController.onPenColorSetupResponse({ Result: result });
              break;

            case this.SettingType.OfflineData:
              this.PenController.onPenOfflineDataSetupResponse({
                Result: result
              });
              break;

            case this.SettingType.PenCapOff:
              this.PenController.onPenCapPowerOnOffSetupResponse({
                Result: result
              });
              break;

            case this.SettingType.Sensitivity:
              this.PenController.onPenSensitivitySetupResponse({
                Result: result
              });
              break;

            case this.SettingType.Timestamp:
              this.PenController.onPenTimestampSetupResponse({
                Result: result
              });
							break;
						default:
							console.log("undefined setting Type");
          }
        }
        break;
      // password
      case this.Cmd.PASSWORD_RESPONSE:
        {
          let status = packet.GetByteToInt();
          let cntRetry = packet.GetByteToInt();
          let cntMax = packet.GetByteToInt();

          if (status === 1) {
            if (this.reCheckPassword) {
              this.PenController.onPenPasswordSetupResponse({ Result: true });
              this.reCheckPassword = false;
              break;
            }

            this.ReqSetupTime(Date.now());
            this.PenController.onPenAuthenticated();
          } else {
            if (this.reCheckPassword) {
              this.reCheckPassword = false;
              this.PenController.onPenPasswordSetupResponse({ Result: false });
            } else {
              this.PenController.onPenPasswordRequest({
                RetryCount: cntRetry,
                ResetCount: cntMax
              });
            }
          }
        }
        break;
      case this.Cmd.PASSWORD_CHANGE_RESPONSE:
        {
          let cntRetry = packet.GetByteToInt();
          let cntMax = packet.GetByteToInt();

          if (packet.Result === 0x00) {
            this.reCheckPassword = true;
            this.ReqInputPassword(this.newPassword);
          } else {
            this.newPassword = "";
            this.PenController.onPenPasswordSetupResponse({ Result: false });
          }
        }
        break;
      //
      // Offline Response
      //
      case this.Cmd.OFFLINE_NOTE_LIST_RESPONSE:
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

          this.PenController.onReceiveOfflineDataList({ OfflineNotes: result });
        }
        break;
      case this.Cmd.OFFLINE_PAGE_LIST_RESPONSE:
        {
          let rb = packet.GetBytes(4);

          let section = parseInt(rb[3] & 0xff);
          let owner = (rb[0] << 24) | (rb[1] << 16) | (rb[2] << 8) | 0x00;
          let note = packet.GetInt();

          let length = packet.GetShort();

          let pages = {};

          for (var i = 0; i < length; i++) {
            pages.put(packet.GetInt());
          }

          let info = {
            Section: section,
            Owner: owner,
            Note: note,
            Pages: pages
          };

          this.PenController.onReceiveOfflineDataList({ OfflineNotes: info });
        }
        break;
      case this.Cmd.OFFLINE_DATA_RESPONSE:
        {
          this.mTotalOfflineStroke = packet.GetInt();
          this.mReceivedOfflineStroke = 0;
          this.mTotalOfflineDataSize = packet.GetInt();

          let isCompressed = (packet.GetByte() === 1);

          this.PenController.onStartOfflineDownload();
        }
        break;

      case this.Cmd.OFFLINE_PACKET_REQUEST:
        // skip because zip library
        break;

      case this.Cmd.OFFLINE_DATA_DELETE_RESPONSE:
        this.PenController.onRemovedOfflineData({
          Result: packet.Result === 0x00
        });
        break;

      //
      // Firmware Response
      //
      case this.Cmd.FIRMWARE_UPLOAD_RESPONSE:
				if (packet.Result !== 0 || packet.GetByteToInt() !== 0) {
					this.IsUploading = false;
					this.PenController.onReceiveFirmwareUpdateResult({ Result: false });
				}
        break;

      case this.Cmd.FIRMWARE_PACKET_REQUEST:
        {
          let status = packet.GetByteToInt();
          let offset = packet.GetInt();

          this.ResponseChunkRequest(offset, status !== 3);
        }
        break;

      case this.Cmd.ONLINE_DATA_RESPONSE:
        break;

      default:
        break;
    }
  }

  CheckEventCount(ecount) {
    //Debug.WriteLine("COUNT : " + ecount + ", " + EventCount);

    if (
      ecount - this.EventCount !== 1 &&
      (ecount !== 0 || this.EventCount !== 255)
    ) {
      let errorDot = null;

      if (this.mPrevDot != null) {
        errorDot = this.mPrevDot.Clone();
        errorDot.DotType = Dot.DotTypes.PEN_ERROR;
      }

      if (ecount - this.EventCount > 1) {
        let extraData =
          "missed event count " + (this.EventCount + 1) + "-" + (ecount - 1);
        this.PenController.onErrorDetected({
          ErrorType: this.ErrorType.InvalidEventCount,
          Dot: errorDot,
          Timestamp: this.SessionTs,
          ExtraData: extraData
        });
      } else if (ecount < this.EventCount) {
        let extraData = "invalid event count " + this.EventCount + "," + ecount;
        this.PenController.onErrorDetected({
          ErrorType: this.ErrorType.InvalidEventCount,
          Dot: errorDot,
          Timestamp: this.SessionTs,
          ExtraData: extraData
        });
      }
    }

    this.EventCount = ecount;
  }

  ParseDotPacket(cmd, pk) {
    //Debug.Write("CMD : " + cmd.ToString() + ", ");

    switch (cmd) {
      case this.Cmd.ONLINE_NEW_PEN_DOWN_EVENT:
        {
          if (
            this.IsStartWithDown &&
            this.IsBeforeMiddle &&
            this.mPrevDot !== null
          ) {
            this.MakeUpDot();
          }

          let ecount = pk.GetByteToInt();

          this.CheckEventCount(ecount);

          this.IsStartWithDown = true;

          this.mTime = pk.GetLong();

          this.SessionTs = this.mTime;

          this.IsBeforeMiddle = false;
          this.IsStartWithPaperInfo = false;

          this.IsDownCreated = false;

          this.mDotCount = 0;

          this.mPenTipType =
            pk.GetByte() == 0x00
              ? this.PenTipType.Normal
              : this.PenTipType.Eraser;
          this.mPenTipColor = pk.GetInt();

          this.mPrevDot = null;
        }
        break;

      case this.Cmd.ONLINE_NEW_PEN_UP_EVENT:
        {
          //UpDotTimerStop();

          let ecount = pk.GetByteToInt();

          this.CheckEventCount(ecount);

          let timestamp = pk.GetLong();

          let dotCount = pk.GetShort();
          let totalImageCount = pk.GetShort();
          let procImageCount = pk.GetShort();
          let succImageCount = pk.GetShort();
          let sendImageCount = pk.GetShort();

          if (
            this.IsStartWithDown &&
            this.IsBeforeMiddle &&
            this.mPrevDot !== null
          ) {
            let udot = this.mPrevDot.Clone();
            udot.DotType = Dot.DotTypes.PEN_UP;

            let imageInfo = null;

            if (!this.IsDownCreated) {
              imageInfo = {
                DotCount: dotCount,
                Total: totalImageCount,
                Processed: procImageCount,
                Success: succImageCount,
                Transferred: sendImageCount
              };
            }

            this.ProcessDot(udot, imageInfo);
          } else if (!this.IsStartWithDown && !this.IsBeforeMiddle) {
            // 즉 다운업(무브없이) 혹은 업만 들어올 경우 UP dot을 보내지 않음
            this.PenController.onErrorDetected({
              ErrorType: this.ErrorType.MissingPenDownPenMove,
              Timestamp: -1
            });
          } else if (!this.IsBeforeMiddle) {
            // 무브없이 다운-업만 들어올 경우 UP dot을 보내지 않음
            this.PenController.onErrorDetected({
              ErrorType: this.ErrorType.MissingPenMove,
              Timestamp: this.SessionTs
            });
          }

          this.mTime = -1;
          this.SessionTs = -1;

          this.IsStartWithDown = false;
          this.IsBeforeMiddle = false;
          this.IsStartWithPaperInfo = false;
          this.IsDownCreated = false;

          this.mDotCount = 0;

          this.mPrevDot = null;
        }
        break;

      case this.Cmd.ONLINE_PEN_UPDOWN_EVENT:
        {
          let IsDown = pk.GetByte() === 0x00;

          if (IsDown) {
            if (
              this.IsStartWithDown &&
              this.IsBeforeMiddle &&
              this.mPrevDot !== null
            ) {
              // 펜업이 넘어오지 않음
              //var errorDot = mPrevDot.Clone();
              //errorDot.DotType = DotTypes.PEN_ERROR;
              //PenController.onErrorDetected(new ErrorDetectedEventArgs(ErrorType.MissingPenUp, errorDot, SessionTs));

              this.MakeUpDot();
            }

            this.IsStartWithDown = true;

            this.mTime = pk.GetLong();

            this.SessionTs = this.mTime;
          } else {
            if (
              this.IsStartWithDown &&
              this.IsBeforeMiddle &&
              this.mPrevDot !== null
            ) {
              this.MakeUpDot(false);
            } else if (!this.IsStartWithDown && !this.IsBeforeMiddle) {
              // 즉 다운업(무브없이) 혹은 업만 들어올 경우 UP dot을 보내지 않음
              this.PenController.onErrorDetected({
                ErrorType: this.ErrorType.MissingPenDownPenMove,
                Timestamp: -1
              });
            } else if (!this.IsBeforeMiddle) {
              // 무브없이 다운-업만 들어올 경우 UP dot을 보내지 않음
              this.PenController.onErrorDetected({
                ErrorType: this.ErrorType.MissingPenMove,
                Timestamp: this.SessionTs
              });
            }

            this.IsStartWithDown = false;

            this.mTime = -1;

            this.SessionTs = -1;
          }

          this.IsBeforeMiddle = false;
          this.IsStartWithPaperInfo = false;
          this.IsDownCreated = false;

          this.mDotCount = 0;

          this.mPenTipType =
            pk.GetByte() == 0x00
              ? this.PenTipType.Normal
              : this.PenTipType.Eraser;
          this.mPenTipColor = pk.GetInt();

          this.mPrevDot = null;
        }
        break;

      case this.Cmd.ONLINE_PEN_DOT_EVENT:
      case this.Cmd.ONLINE_NEW_PEN_DOT_EVENT:
        {
          this.PenDotEvent(cmd, pk);
        }
        break;

      case this.Cmd.ONLINE_PAPER_INFO_EVENT:
      case this.Cmd.ONLINE_NEW_PAPER_INFO_EVENT:
        {
          this.PaperInfoEvent(cmd, pk);
        }
        break;

      case this.Cmd.ONLINE_PEN_ERROR_EVENT:
      case this.Cmd.ONLINE_NEW_PEN_ERROR_EVENT:
        {
          /*
					if (cmd == Cmd.ONLINE_NEW_PEN_ERROR_EVENT)
					{
						upDotTimer.Change(UPDOT_TIMEOUT, Timeout.Infinite);
					}
					*/
          if (cmd == this.Cmd.ONLINE_NEW_PEN_ERROR_EVENT) {
            let ecount = pk.GetByteToInt();

            this.CheckEventCount(ecount);
          }

          let timeadd = pk.GetByteToInt();
          this.mTime += timeadd;

          let force = pk.GetShort();
          let brightness = pk.GetByteToInt();
          let exposureTime = pk.GetByteToInt();
          let ndacProcessTime = pk.GetByteToInt();
          let labelCount = pk.GetShort();
          let ndacErrorCode = pk.GetByteToInt();
          let classType = pk.GetByteToInt();
          let errorCount = pk.GetByteToInt();

          let newInfo = {
            Timestamp: this.mTime,
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

          if (this.mPrevDot != null) {
            errorDot = this.mPrevDot.Clone();
            errorDot.DotType = Dot.DotTypes.PEN_UP;
          }

          this.PenController.onErrorDetected({
            ErrorType: this.ErrorType.ImageProcessingError,
            Dot: errorDot,
            Timestamp: this.SessionTs,
            ImageProcessErrorInfo: newInfo
          });
        }
				break;
				default:
				console.log("undefined")
    }
  }

  PaperInfoEvent(cmd, pk) {
    if (
      cmd === this.Cmd.ONLINE_NEW_PAPER_INFO_EVENT ||
      cmd === this.Cmd.ONLINE_ENCRYPTION_PAPER_INFO_EVENT
    ) {
      let ecount = pk.GetByteToInt();

      this.CheckEventCount(ecount);
    }

    // 미들도트 중에 페이지가 바뀐다면 강제로 펜업을 만들어 준다.
    if (this.IsStartWithDown && this.IsBeforeMiddle && this.mPrevDot !== null) {
      this.MakeUpDot(false);
    }

    let rb = pk.GetBytes(4);

    this.mCurSection = rb[3] & 0xff;
    this.mCurOwner = Converter.byteArrayToInt([rb[0], rb[1], rb[2], 0x00]);
    this.mCurNote = pk.GetInt();
    this.mCurPage = pk.GetInt();

    this.mDotCount = 0;

    this.IsStartWithPaperInfo = true;
  }

  PenDotEvent(cmd, pk) {
    if (
      cmd === this.Cmd.ONLINE_NEW_PEN_DOT_EVENT ||
      cmd === this.Cmd.ONLINE_ENCRYPTION_PEN_DOT_EVENT
    ) {
      let ecount = pk.GetByteToInt();

      this.CheckEventCount(ecount);
    }

    let timeadd = pk.GetByte();

    this.mTime += timeadd;

    let force = pk.GetShort();

    let x = pk.GetShort();
    let y = pk.GetShort();

    let fx = pk.GetByte();
    let fy = pk.GetByte();

    let dot = null;

    if (!this.HoverMode && !this.IsStartWithDown) {
      if (!this.IsStartWithPaperInfo) {
        //펜 다운 없이 페이퍼 정보 없고 무브가 오는 현상(다운 - 무브 - 업 - 다운X - 무브)
        this.PenController.onErrorDetected({
          ErrorType: this.ErrorType.MissingPenDown,
          Timestamp: -1
        });
      } else {
        this.mTime = Date.now();

        this.SessionTs = this.mTime;

        let errorDot = this.MakeDot(
          this.PenMaxForce,
          this.mCurOwner,
          this.mCurSection,
          this.mCurNote,
          this.mCurPage,
          this.mTime,
          x,
          y,
          fx,
          fy,
          force,
          Dot.DotTypes.PEN_ERROR,
          this.mPenTipColor
        );

        //펜 다운 없이 페이퍼 정보 있고 무브가 오는 현상(다운 - 무브 - 업 - 다운X - 무브)
        this.PenController.onErrorDetected({
          ErrorType: this.ErrorType.MissingPenDown,
          Dot: errorDot,
          Timestamp: this.SessionTs
        });

        this.IsStartWithDown = true;
        this.IsDownCreated = true;
      }
    }

    if (this.HoverMode && !this.IsStartWithDown && this.IsStartWithPaperInfo) {
      dot = this.MakeDot(
        this.PenMaxForce,
        this.mCurOwner,
        this.mCurSection,
        this.mCurNote,
        this.mCurPage,
        this.mTime,
        x,
        y,
        fx,
        fy,
        force,
        Dot.DotTypes.PEN_HOVER,
        this.mPenTipColor
      );
    } else if (this.IsStartWithDown) {
      if (this.IsStartWithPaperInfo) {
        dot = this.MakeDot(
          this.PenMaxForce,
          this.mCurOwner,
          this.mCurSection,
          this.mCurNote,
          this.mCurPage,
          this.mTime,
          x,
          y,
          fx,
          fy,
          force,
          this.mDotCount == 0 ? Dot.DotTypes.PEN_DOWN : Dot.DotTypes.PEN_MOVE,
          this.mPenTipColor
        );
      } else {
        //펜 다운 이후 페이지 체인지 없이 도트가 들어왔을 경우
        this.PenController.onErrorDetected({
          ErrorType: this.ErrorType.MissingPageChange,
          Timestamp: this.SessionTs
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

    this.IsBeforeMiddle = true;
    this.mPrevDot = dot;
    this.mDotCount++;
  }

  OnDisconnected() {
    if (this.IsStartWithDown && this.IsBeforeMiddle && this.mPrevDot !== null) {
      this.MakeUpDot();

      this.mTime = -1;
      this.SessionTs = -1;

      this.IsStartWithDown = false;
      this.IsBeforeMiddle = false;
      this.IsStartWithPaperInfo = false;

      this.mDotCount = 0;

      this.mPrevDot = null;
    }
  }

  ProcessDot(dot, obj) {
    //dotFilterForPaper.Put(dot, obj);
    this.SendDotReceiveEvent(dot, obj);
  }

  SendDotReceiveEvent(dot, obj) {
    this.PenController.onReceiveDot({ Dot: dot, ImageProcessingInfo: obj });
  }

  AddOfflineFilteredDot(dot, obj) {
    this.offlineStroke.push(dot);
  }

  ParseDot(mPack, type) {
    let timeadd = mPack.GetByte();

    this.mTime += timeadd;

    let force = mPack.GetShort();

    let x = mPack.GetShort();
    let y = mPack.GetShort();

    let fx = mPack.GetByte();
    let fy = mPack.GetByte();

    let tx = mPack.GetByte();
    let ty = mPack.GetByte();

    let twist = mPack.GetShort();

    this.ProcessDot(
      this.MakeDot(
        this.PenMaxForce,
        this.mCurOwner,
        this.mCurSection,
        this.mCurNote,
        this.mCurPage,
        this.mTime,
        x,
        y,
        fx,
        fy,
        force,
        type,
        this.mPenTipColor
      ),
      null
    );
    //PenController.onReceiveDot(new DotReceivedEventArgs(MakeDot(PenMaxForce, mCurOwner, mCurSection, mCurNote, mCurPage, mTime, x, y, fx, fy, force, type, mPenTipColor)));
  }

  UpDotTimerCallback(state) {
    console.log("UpDotTimerCallback");

    if (this.IsStartWithDown && this.IsBeforeMiddle && this.mPrevDot !== null) {
      this.MakeUpDot();

      this.mTime = -1;
      this.SessionTs = -1;

      this.IsStartWithDown = false;
      this.IsBeforeMiddle = false;
      this.IsStartWithPaperInfo = false;

      this.mDotCount = 0;

      this.mPrevDot = null;
    }
  }

  MakeUpDot(isError = true) {
    if (isError) {
      let errorDot = this.mPrevDot.Clone();
      errorDot.DotType = Dot.DotTypes.PEN_ERROR;
      this.PenController.onErrorDetected({
        ErrorType: this.ErrorType.MissingPenUp,
        Dot: errorDot,
        Timestamp: this.SessionTs
      });
    }

    var audot = this.mPrevDot.Clone();
    audot.DotType = Dot.DotTypes.PEN_UP;
    this.ProcessDot(audot, null);
  }

  Escape(input) {
    if (
      input === this.Const.PK_STX ||
      input === this.Const.PK_ETX ||
      input === this.Const.PK_DLE
    ) {
      // let result = new Array(2)
      // result.push(this.Const.PK_DLE)
      // result.push((input ^ 0x20))
      // return result
      return [this.Const.PK_DLE, input ^ 0x20];
    } else {
      return [input];
    }
  }

  Send(bf) {
    this.PenController.onWrite(new Buffer(new Uint8Array(bf.ToArray())));

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
      this.SupportedProtocolVersion
    );

    bf.Put(this.Const.PK_STX, false)
      .Put(this.Cmd.VERSION_REQUEST)
      .PutShort(42)
      .PutNull(16)
      // .Put(0x12)
      .Put(0xf0)
      .Put(0x01)
      .PutArray(StrAppVersion, 16)
      .PutArray(StrProtocolVersion, 8)
      .Put(this.Const.PK_ETX, false);

    this.Send(bf);
  }

  ReqVersionTask() {
    // TODO make thread for try 3times
    // var that = this;
    setTimeout(
      function() {
        this.ReqVersion();
      }.bind(this),
      500
    );
  }

  //
  // Password
  //
  ReqSetUpPassword(oldPassword, newPassword = "") {
    if (!oldPassword || !newPassword) return false;
    if (oldPassword === this.DEFAULT_PASSWORD) return false;
    if (newPassword === this.DEFAULT_PASSWORD) return false;

    this.newPassword = newPassword;

    let oPassByte = Converter.toUTF8Array(oldPassword);
    let nPassByte = Converter.toUTF8Array(newPassword);

    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(this.Const.PK_STX, false)
      .Put(this.Cmd.PASSWORD_CHANGE_REQUEST)
      .PutShort(33)
      .Put(newPassword == "" ? 0 : 1)
      .PutArray(oPassByte, 16)
      .PutArray(nPassByte, 16)
      .Put(this.Const.PK_ETX, false);

    return this.Send(bf);
  }

  ReqInputPassword(password) {
    if (!password) return false;
    if (password === this.DEFAULT_PASSWORD) return false;

    let bStrByte = Converter.toUTF8Array(password);

    let bf = new ByteUtil(this.Escape.bind(this));
    bf.Put(this.Const.PK_STX, false)
      .Put(this.Cmd.PASSWORD_REQUEST)
      .PutShort(16)
      .PutArray(bStrByte, 16)
      .Put(this.Const.PK_ETX, false);

    return this.Send(bf);
  }

  ReqPenStatus() {
    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(this.Const.PK_STX, false)
      .Put(this.Cmd.SETTING_INFO_REQUEST)
      .PutShort(0)
      .Put(this.Const.PK_ETX, false);

    return this.Send(bf);
  }

  RequestChangeSetting(stype, value) {
    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(this.Const.PK_STX, false).Put(this.Cmd.SETTING_CHANGE_REQUEST);

    switch (stype) {
      case this.SettingType.Timestamp:
        bf.PutShort(9)
          .Put(stype)
          .PutLong(value);
        break;

      case this.SettingType.AutoPowerOffTime:
        bf.PutShort(3)
          .Put(stype)
          .PutShort(value);
        break;

      case this.SettingType.LedColor:
        let b = Converter.intToByteArray(value);
        let nBytes = new Uint8Array([b[3], b[2], b[1], b[0]]);
        bf.PutShort(5)
          .Put(stype)
          .PutArray(nBytes.buffer, 4);

        //bf.PutShort(5).Put((byte)stype).PutInt((int)value);
        break;

      case this.SettingType.PenCapOff:
      case this.SettingType.AutoPowerOn:
      case this.SettingType.Beep:
      case this.SettingType.Hover:
      case this.SettingType.OfflineData:
      case this.SettingType.DownSampling:
        bf.PutShort(2)
          .Put(stype)
          .Put(value ? 1 : 0);
        break;
      case this.SettingType.Sensitivity:
        bf.PutShort(2)
          .Put(stype)
          .Put(value);
        break;
      case this.SettingType.UsbMode:
        bf.PutShort(2)
          .Put(stype)
          .Put(value);
        break;
      case this.SettingType.BtLocalName:
        let StrByte = Converter.toUTF8Array(value);
        bf.PutShort(18)
          .Put(stype)
          .Put(16)
          .PutArray(StrByte, 16);
        break;
      case this.SettingType.FscSensitivity:
        bf.PutShort(2)
          .Put(stype)
          .PutShort(value);
        break;
      case this.SettingType.DataTransmissionType:
        bf.PutShort(2)
          .Put(stype)
          .Put(value);
        break;
      case this.SettingType.BeepAndLight:
        bf.PutShort(2)
          .Put(stype)
          .Put(0x00);
				break;
			default:
				console.log("undefined setting type")
    }

    bf.Put(this.Const.PK_ETX, false);

    return this.Send(bf);
  }

  ReqSetupTime(timetick) {
    return this.RequestChangeSetting(this.SettingType.Timestamp, timetick);
  }

  ReqSetupPenAutoShutdownTime(minute) {
    return this.RequestChangeSetting(this.SettingType.AutoPowerOffTime, minute);
  }

  ReqSetupPenCapPower(enable) {
    return this.RequestChangeSetting(this.SettingType.PenCapOff, enable);
  }

  ReqSetupPenAutoPowerOn(enable) {
    return this.RequestChangeSetting(this.SettingType.AutoPowerOn, enable);
  }

  ReqSetupPenBeep(enable) {
    return this.RequestChangeSetting(this.SettingType.Beep, enable);
  }

  ReqSetupHoverMode(enable) {
    return this.RequestChangeSetting(this.SettingType.Hover, enable);
  }

  ReqSetupOfflineData(enable) {
    return this.RequestChangeSetting(this.SettingType.OfflineData, enable);
  }

  ReqSetupPenColor(enable) {
    return this.RequestChangeSetting(this.SettingType.LedColor, enable);
  }

  ReqSetupPenSensitivity(step) {
    return this.RequestChangeSetting(this.SettingType.Sensitivity, step);
  }

  ReqSetupUsbMode(mode) {
    return this.RequestChangeSetting(this.SettingType.UsbMode, mode);
  }

  ReqSetupDownSampling(enable) {
    return this.RequestChangeSetting(this.SettingType.DownSampling, enable);
  }

  ReqSetupBtLocalName(btLocalName) {
    return this.RequestChangeSetting(this.SettingType.BtLocalName, btLocalName);
  }

  ReqSetupPenFscSensitivity(step) {
    return this.RequestChangeSetting(this.SettingType.FscSensitivity, step);
  }

  ReqSetupDataTransmissionType(type) {
    return this.RequestChangeSetting(
      this.SettingType.DataTransmissionType,
      type
    );
  }

  ReqBeepAndLight() {
    return this.RequestChangeSetting(this.SettingType.BeepAndLight);
  }

  IsSupportPenProfile() {
    let temp = this.ProtocolVersion.split(".");
    let tempVer = "";
    if (temp.length === 1) tempVer += temp[0];
    else if (temp.length >= 2) tempVer += temp[0] + "." + temp[1];

    let ver = parseFloat(tempVer);

    return ver >= this.PEN_PROFILE_SUPPORT_PROTOCOL_VERSION;
  }

  SendAddUsingNote(sectionId = -1, ownerId = -1, noteIds = null) {
    let bf = new ByteUtil(this.Escape.bind(this));
    bf.Put(this.Const.PK_STX, false).Put(this.Cmd.ONLINE_DATA_REQUEST);

    if (sectionId >= 0 && ownerId > 0 && noteIds == null) {
      bf.PutShort(2 + 8)
        .PutShort(1)
        .Put(this.GetSectionOwnerByte(sectionId, ownerId))
        .Put(0xff)
        .Put(0xff)
        .Put(0xff)
        .Put(0xff);
    } else if (sectionId >= 0 && ownerId > 0 && noteIds != null) {
      let length = 2 + noteIds.Length * 8;

      bf.PutShort(length).PutShort(noteIds.Length);
      noteIds.foreach(item => {
        bf.Put(this.GetSectionOwnerByte(sectionId, ownerId)).PutInt(item);
      })
    } else {
      bf.PutShort(2)
        .Put(0xff)
        .Put(0xff);
    }

    bf.Put(this.Const.PK_ETX, false);

    return this.Send(bf);
  }

  SendAddUsingNotes(sectionId, ownerId) {
    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(this.Const.PK_STX, false).Put(this.Cmd.ONLINE_DATA_REQUEST);

    bf.PutShort(2 + sectionId.Length * 8).PutShort(sectionId.Length);
    for (let i = 0; i < sectionId.Length; ++i) {
      bf.Put(this.GetSectionOwnerByte(sectionId[i], ownerId[i]))
        .Put(0xff)
        .Put(0xff)
        .Put(0xff)
        .Put(0xff);
    }

    bf.Put(this.Const.PK_ETX, false);

    return this.Send(bf);
  }

  ReqAddUsingNote(section, owner, notes) {
    return this.SendAddUsingNote(section, owner, notes);
  }

  //
  // Offline Data
  //
  ReqOfflineDataList(section, owner, note) {
    if (note) {

      let bf = new ByteUtil(this.Escape.bind(this));
  
      bf.Put(this.Const.PK_STX, false)
        .Put(this.Cmd.OFFLINE_PAGE_LIST_REQUEST)
        .PutShort(8)
        .Put(this.GetSectionOwnerByte(section, owner))
        .PutInt(note)
        .Put(this.Const.PK_ETX, false);
  
      return this.Send(bf);
    }else {
      let bf = new ByteUtil(this.Escape.bind(this));

      let pInfo =
        section > 0 && owner > 0
          ? this.GetSectionOwnerByte(section, owner)
          : new Uint8Array([0xff, 0xff, 0xff, 0xff]).buffer;
  
      bf.Put(this.Const.PK_STX, false)
        .Put(this.Cmd.OFFLINE_NOTE_LIST_REQUEST)
        .PutShort(4)
        .Put(pInfo)
        .Put(this.Const.PK_ETX, false);
  
      return this.Send(bf);
    }
  }

  ReqOfflineData(section, owner, note, deleteOnFinished = true, pages = null) {
    let ownerByte = Converter.intToByteArray(owner);

    let length = 14;

    length += pages == null ? 0 : pages.Length * 4;

    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(this.Const.PK_STX, false)
      .Put(this.Cmd.OFFLINE_DATA_REQUEST)
      .PutShort(length)
      .Put(deleteOnFinished ? 1 : 2)
      .Put(0x01)
      .Put(this.GetSectionOwnerByte(section, owner))
      .PutInt(note)
      .PutInt(pages == null ? 0 : pages.Length);

    if (pages != null) {
      pages.foreach(page => {
        bf.PutInt(page);
      })
    }

    bf.Put(this.Const.PK_ETX, false);

    return this.Send(bf);
  }

  SendOfflinePacketResponse(index, isSuccess = true) {
    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(this.Const.PK_STX, false)
      .Put(this.Cmd.OFFLINE_PACKET_RESPONSE)
      .Put(isSuccess ? 0 : 1)
      .PutShort(3)
      .PutShort(index)
      .Put(1)
      .Put(this.Const.PK_ETX, false);

    this.Send(bf);
  }

  ReqRemoveOfflineData(section, owner, notes) {
    let bf = new ByteUtil(this.Escape.bind(this));

    bf.Put(this.Const.PK_STX, false).Put(this.Cmd.OFFLINE_DATA_DELETE_REQUEST);

    let length = 5 + notes.Length * 4;

    bf.PutShort(length)
      .Put(this.GetSectionOwnerByte(section, owner))
      .Put(notes.Length);
    notes.foreach(noteId => {
      bf.PutInt(noteId);
    })


    bf.Put(this.Const.PK_ETX, false);

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

  isF121MG(macAddress) {
    const MG_F121_MAC_START = "9C:7B:D2:22:00:00";
    const MG_F121_MAC_END = "9C:7B:D2:22:18:06";
    let address = Converter.byteArrayToLong(macAddress.replace("/:/g", ""), 16);
    let mgStart = Converter.byteArrayToLong(
      MG_F121_MAC_START.replace("/:/g", ""),
      16
    );
    let mgEnd = Converter.byteArrayToLong(
      MG_F121_MAC_END.replace("/:/g", ""),
      16
    );

    if (address >= mgStart && address <= mgEnd) return true;
    else return false;
  }

  //
  // Protocol Parse
  //
  ProtocolParse(buff) {
    let size = buff.length;
    for (let i = 0; i < size; i++) {
      if (buff[i] == this.Const.PK_STX) {
        // 패킷 시작
        this.mBuffer = new ByteUtil();

        this.IsEscape = false;
      } else if (buff[i] === this.Const.PK_ETX) {
        // 패킷 끝
        let builder = new Packet.PacketBuilder();

        let cmd = this.mBuffer.GetByteToInt();

        // event command is 0x6X
        // let cmdstr = Enum.GetName(typeof (Cmd), cmd);

        // let result_size = (cmd >> 4) != 0x6 && cmdstr != null && cmdstr.EndsWith("RESPONSE") ? 1 : 0;
        let result_size = cmd >> 4 != 0x6 ? 1 : 0;

        let result = result_size > 0 ? this.mBuffer.GetByteToInt() : -1;

        let length = this.mBuffer.GetShort();

        let data = this.mBuffer.GetBytes();

        builder
          .cmd(cmd)
          .result(result)
          .data(data);

        this.mBuffer.Clear();
        this.mBuffer = null;
        //if ((Cmd)cmd == Cmd.ONLINE_NEW_PEN_UP_EVENT)
        //{ }
        //else
        this.ParsePacket(builder.Build());

        this.IsEscape = false;
      } else if (buff[i] == this.Const.PK_DLE) {
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

// Defines
PenClientParserV2.prototype.Const = Object.freeze({
  PK_STX: 0xc0,
  PK_ETX: 0xc1,
  PK_DLE: 0x7d,

  PK_POS_CMD: 1,
  PK_POS_RESULT: 2,
  PK_POS_LENG1: 2,
  PK_POS_LENG2: 3,

  PK_HEADER_SIZE: 3
});

PenClientParserV2.prototype.Cmd = Object.freeze({
  VERSION_REQUEST: 0x01,
  VERSION_RESPONSE: 0x81,

  PASSWORD_REQUEST: 0x02,
  PASSWORD_RESPONSE: 0x82,

  PASSWORD_CHANGE_REQUEST: 0x03,
  PASSWORD_CHANGE_RESPONSE: 0x83,

  SETTING_INFO_REQUEST: 0x04,
  SETTING_INFO_RESPONSE: 0x84,

  LOW_BATTERY_EVENT: 0x61,
  SHUTDOWN_EVENT: 0x62,

  SETTING_CHANGE_REQUEST: 0x05,
  SETTING_CHANGE_RESPONSE: 0x85,

  ONLINE_DATA_REQUEST: 0x11,
  ONLINE_DATA_RESPONSE: 0x91,

  ONLINE_PEN_UPDOWN_EVENT: 0x63,
  ONLINE_PAPER_INFO_EVENT: 0x64,
  ONLINE_PEN_DOT_EVENT: 0x65,
  ONLINE_PEN_ERROR_EVENT: 0x68,

  ONLINE_NEW_PEN_DOWN_EVENT: 0x69,
  ONLINE_NEW_PEN_UP_EVENT: 0x6a,
  ONLINE_NEW_PAPER_INFO_EVENT: 0x6b,
  ONLINE_NEW_PEN_DOT_EVENT: 0x6c,
  ONLINE_NEW_PEN_ERROR_EVENT: 0x6d,

  ONLINE_ENCRYPTION_PAPER_INFO_EVENT: 0x6e,
  ONLINE_ENCRYPTION_PEN_DOT_EVENT: 0x6f,

  OFFLINE_NOTE_LIST_REQUEST: 0x21,
  OFFLINE_NOTE_LIST_RESPONSE: 0xa1,

  OFFLINE_PAGE_LIST_REQUEST: 0x22,
  OFFLINE_PAGE_LIST_RESPONSE: 0xa2,

  OFFLINE_DATA_REQUEST: 0x23,
  OFFLINE_DATA_RESPONSE: 0xa3,
  OFFLINE_PACKET_REQUEST: 0x24,
  OFFLINE_PACKET_RESPONSE: 0xa4,

  OFFLINE_DATA_DELETE_REQUEST: 0x25,
  OFFLINE_DATA_DELETE_RESPONSE: 0xa5,

  FIRMWARE_UPLOAD_REQUEST: 0x31,
  FIRMWARE_UPLOAD_RESPONSE: 0xb1,
  FIRMWARE_PACKET_REQUEST: 0x32,
  FIRMWARE_PACKET_RESPONSE: 0xb2,

  PEN_PROFILE_REQUEST: 0x41,
  PEN_PROFILE_RESPONSE: 0xc1,

  AES_KEY_REQUEST: 0x74,
  AES_KEY_RESPONSE: 0xf4
});

PenClientParserV2.prototype.SettingType = Object.freeze({
  Timestamp: 1,
  AutoPowerOffTime: 2,
  PenCapOff: 3,
  AutoPowerOn: 4,
  Beep: 5,
  Hover: 6,
  OfflineData: 7,
  LedColor: 8,
  Sensitivity: 9,
  UsbMode: 10,
  DownSampling: 11,
  BtLocalName: 12,
  FscSensitivity: 13,
  DataTransmissionType: 14,
  BeepAndLight: 16
});

PenClientParserV2.prototype.PenTipType = Object.freeze({
  Normal: 0,
  Eraser: 1
});

PenClientParserV2.prototype.ErrorType = Object.freeze({
  MissingPenUp: 1,
  MissingPenDown: 2,
  InvalidTime: 3,
  MissingPenDownPenMove: 4,
  ImageProcessingError: 5,
  InvalidEventCount: 6,
  MissingPageChange: 7,
  MissingPenMove: 8
});

PenClientParserV2.prototype.SupportedProtocolVersion = Object.freeze("2.12");
PenClientParserV2.prototype.PEN_PROFILE_SUPPORT_PROTOCOL_VERSION = Object.freeze(
  2.1
);
PenClientParserV2.prototype.DEFAULT_PASSWORD = Object.freeze("0000");
PenClientParserV2.prototype.F121 = Object.freeze("NWP-F121");
PenClientParserV2.prototype.F121MG = Object.freeze("NWP-F121MG");

// Variables
PenClientParserV2.prototype.DeviceName = "";
PenClientParserV2.prototype.FirmwareVersion = "";
PenClientParserV2.prototype.ProtocolVersion = "";
PenClientParserV2.prototype.SubName = "";
PenClientParserV2.prototype.MacAddress = "";
PenClientParserV2.prototype.DeviceType = 0;
PenClientParserV2.prototype.MaxForce = 0;
PenClientParserV2.prototype.mTime = -1;
PenClientParserV2.prototype.mPenTipType = -1;
PenClientParserV2.prototype.mPenTipColor = -1;
PenClientParserV2.prototype.IsStartWithDown = false;
PenClientParserV2.prototype.mDotCount = -1;
PenClientParserV2.prototype.mCurSection = -1;
PenClientParserV2.prototype.mCurOwner = -1;
PenClientParserV2.prototype.mCurNote = -1;
PenClientParserV2.prototype.mCurPage = -1;
PenClientParserV2.prototype.mTotalOfflineStroke = -1;
PenClientParserV2.prototype.mReceivedOfflineStroke = 0;
PenClientParserV2.prototype.mTotalOfflineDataSize = -1;
PenClientParserV2.prototype.PenMaxForce = 0;
PenClientParserV2.prototype.reCheckPassword = false;
PenClientParserV2.prototype.newPassword = null;
PenClientParserV2.prototype.isConnectWrite = false;
PenClientParserV2.prototype.HoverMode = false;
PenClientParserV2.prototype.offlienDataPacketRetryCount = 0;

PenClientParserV2.prototype.mPrevDot = null;
PenClientParserV2.prototype.IsBeforeMiddle = false;
PenClientParserV2.prototype.IsStartWithPaperInfo = false;
PenClientParserV2.prototype.IsDownCreated = false;
PenClientParserV2.prototype.SessionTs = -1;
PenClientParserV2.prototype.EventCount = -1;
PenClientParserV2.prototype.offlineStroke = {};

PenClientParserV2.prototype.mBuffer = null;
PenClientParserV2.prototype.IsEscape = false;
