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
   The constant PASSWORD_SETUP_SUCCESS.
   - data: PenPasswordChangeStruct
   */
  PASSWORD_SETUP_SUCCESS: 0x52,

  /**
   The constant PASSWORD_SETUP_FAILURE.
   - data: PenPasswordChangeStruct
   */
  PASSWORD_SETUP_FAILURE: 0x53,

  /**
   The constant EVENT_LOW_BATTERY.
   - data : Int (%)
   */
  EVENT_LOW_BATTERY: 0x63,

  /**
   - data: PowerOffReason
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
   Pens Log Info(for touch and play)
   - data: LogInfoStruct
   */
  RES_LOG_INFO: 0xf4,

  /**
   Pens Log Data(for touch and play)
   - data: LogInfoDataStruct
   */
  RES_LOG_DATA: 0xf5
};

export default PenMessageType;
