const PenMessageType = {
  /**
   Pens when the pen authorized, the events that occur
   - data: nil
   */
  PEN_AUTHORIZED: 0x01,

  /**
   Request Password, the events that occur
   - data: PenPasswordStruct?
   */
  PEN_PASSWORD_REQUEST: 0x02,

  /**
   Pens when the pen disconnected, the events that occur
   - data: nil
   */
  PEN_DISCONNECTED: 0x04,

  /**
   * Pens when the connection is successful, the events that occur
   - data: nil
   */
  PEN_CONNECTION_SUCCESS: 0x06,
  /**
   The status(battery, memory, ...) of pen
   - data: PenSettingStruct
   */
  PEN_SETTING_INFO: 0x11,

  /**
   The constant PEN_SETUP_SUCCESS.
   - data: PenSetupType
   */
  PEN_SETUP_SUCCESS: 0x12,

  /**
   The constant PEN_SETUP_FAILURE.
   - data: ErrorCode
   */
  PEN_SETUP_FAILURE: 0x13,

  /**
   The constant PEN_USING_NOTE_SET_RESULT.
   - data: Result
   */
  PEN_USING_NOTE_SET_RESULT: 0x1a,

  /**
   The constant PASSWORD_SETUP_SUCCESS.
   - data: UsingPassword (isPenUsingPassword: Boolean)
   */
  PASSWORD_SETUP_SUCCESS: 0x52,

  /**
   The constant PASSWORD_SETUP_FAILURE.
   - data: PenPasswordChangeStruct
   */
  PASSWORD_SETUP_FAILURE: 0x53,

  /**
   * The constant PEN_SETUP_FAILURE_ILLEGAL_PASSWORD_0000.
   * data: nil
   */
  PEN_ILLEGAL_PASSWORD_0000: 0x54,

  /**
   The constant EVENT_LOW_BATTERY.
   - data : Int (%)
   */
  EVENT_LOW_BATTERY: 0x63,

  /**
   - data: PowerOffReason(0: autoPowerOffTime, 1: lowBattery, 2: update, 3: powerKey, 4: penCapPowerOff, 
    5: alert(SystemError), 6: usbDiskIn(BTDisconnected), 7: passwordFail, 8: testToolDisconnected)
   */
  EVENT_POWER_OFF: 0x64,

  /**
   Message showing the status of the firmware upgrade pen
   - data : Float( 0 ~ 100.0 %)
   */
  PEN_FW_UPGRADE_STATUS: 0x22,

  /**
   * When the firmware upgrade is successful, the pen events that occur
   */
  PEN_FW_UPGRADE_SUCCESS: 0x23,

  /**
   * When the firmware upgrade is fails, the pen events that occur
   */
  PEN_FW_UPGRADE_FAILURE: 0x24,

  /**
   * When the firmware upgrade is suspended, the pen events that occur
   */
  PEN_FW_UPGRADE_SUSPEND: 0x25,

  /**
   Off-line data stored in the pen's
   - data: [(SectionId: UInt8, OnerId: UInt32, Note(Book)Id: UInt32)] Tuple List
   */
  OFFLINE_DATA_NOTE_LIST: 0x30,

  /**
   Off-line data stored in the pen's
   - data: [PageId : UInt32] List
   */
  OFFLINE_DATA_PAGE_LIST: 0x31,

  /**
   The constant OFFLINE_DATA_SEND_START.
   - data: nil
   */
  OFFLINE_DATA_SEND_START: 0x32,

  /**
   The constant OFFLINE_DATA_SEND_STATUS.
   - data : Float(0 ~ 100.0 %)
   */
  OFFLINE_DATA_SEND_STATUS: 0x33,

  /**
   The constant OFFLINE_DATA_SEND_SUCCESS.
   - data : OffLineData
   */
  OFFLINE_DATA_SEND_SUCCESS: 0x34,

  /**
   The constant OFFLINE_DATA_SEND_FAILURE.
   - data: nil
   */
  OFFLINE_DATA_SEND_FAILURE: 0x35,

  /**
   The constant OFFLINE_DATA_DELETE_RESPONSE.
   - data: Result
   */
  OFFLINE_DATA_DELETE_RESPONSE: 0xa5,

  /**
   * Pens when the connection fails cause duplicate BT connection, an event that occurs
   */
  PEN_CONNECTION_FAILURE_BTDUPLICATE: 0x54,

  /**
   Pens Profile (key,value)
   - data: ProfileStruct
   */
  PEN_PROFILE: 0xc1,

  /**
   Pens PDS(for touch and play)
   - data: PDSStruct
   */
  RES_PDS: 0x73,

  /**
   Pens Error
   - data: DotError
   */
  EVENT_DOT_ERROR: 0x68,

  /**
   Pens Checking PUI
   - data: Command
   */
  EVENT_DOT_PUI: 0x69,

  /**
   Pens Log Info(for touch and play)
   - data: LogInfoStruct
   */
  RES_LOG_INFO: 0xf4,

  /**
   Pens Log Data(for touch and play)
   - data: LogInfoDataStruct
   */
  RES_LOG_DATA: 0xf5,
};

export default PenMessageType;

export const SettingType = {
  TimeStamp: 1,
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
  BeepAndLight: 16,
  InitDisk: 17,
};

export const PenTipType = {
  Normal: 0,
  Eraser: 1,
};

export const ErrorType = {
  MissingPenUp: 1,
  MissingPenDown: 2,
  InvalidTime: 3,
  MissingPenDownPenMove: 4,
  ImageProcessingError: 5,
  InvalidEventCount: 6,
  MissingPageChange: 7,
  MissingPenMove: 8,
};

export const ProfileType = {
  CreateProfile: 0x01,
  DeleteProfile: 0x02,
  InfoProfile: 0x03,
  WriteProfileValue: 0x11,
  ReadProfileValue: 0x12,
  DeleteProfileValue: 0x13,
};

export const FirmwareStatusType = {
  STATUS_START: 0,
  STATUS_CONTINUE: 1,
  STATUS_END: 2,
  STATUS_ERROR: 3,
};
