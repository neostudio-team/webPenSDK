const CMD = {
  /**디바이스에 대한 버전(정보)을 요청하는 커맨드, 펜과 연결시 최우선 수행*/
  VERSION_REQUEST: 0x01,
  /**디바이스에 대한 버전(정보)을 반환하는 커맨드 */
  VERSION_RESPONSE: 0x81,

  /**비밀번호를 입력하는 커맨드, 디바이스 버전정보에 따라 사용 여부 결정*/
  PASSWORD_REQUEST: 0x02,
  /**입력된 비밀번호의 결과 값을 반환하는 커맨드 */
  PASSWORD_RESPONSE: 0x82,

  /**비밀번호를 변경을 요청하는 커맨드, 비밀번호 이용한 연결상태일 때만 사용 가능 */
  PASSWORD_CHANGE_REQUEST: 0x03,
  /**비밀번호 변경에 대한 결과 값을 반환하는 커맨드 */
  PASSWORD_CHANGE_RESPONSE: 0x83,

  /**각종 펜 설정에 대한 정보를 요청하는 커맨드 */
  SETTING_INFO_REQUEST: 0x04,
  /**펜 설정 정보를 반환하는 커맨드, SettingInfo 참고*/
  SETTING_INFO_RESPONSE: 0x84,

  /**배터리 알람이 발생했을 때, 반환되는 커맨드 */
  LOW_BATTERY_EVENT: 0x61,
  /**전원이 꺼졌을 때 이유를 반환하는 커맨드 */
  SHUTDOWN_EVENT: 0x62,

  /**각종 펜 설정의 변경을 요청하는 커맨드 */
  SETTING_CHANGE_REQUEST: 0x05,
  /**펜 설정 변경의 성공여부를 반환하는 커맨드 */
  SETTING_CHANGE_RESPONSE: 0x85,

  /**실시간 필기 데이터를 요청하는 커맨드 */
  ONLINE_DATA_REQUEST: 0x11,
  /**실시간 필기 데이터 요청에 대한 응답을 반환하는 커맨드 */
  ONLINE_DATA_RESPONSE: 0x91,

  /**펜 UP/DOWN 시 시각, 펜의 타입, 펜의 색상을 반환하는 커맨드 */
  ONLINE_PEN_UPDOWN_EVENT: 0x63,
  /**현재 펜이 입력된 종이의 정보를 반환하는 커맨드 */
  ONLINE_PAPER_INFO_EVENT: 0x64,
  /**펜이 입력되었을 때 각종 Dot 정보(좌표 값, 기울기 등)를 반환하는 커맨드 */
  ONLINE_PEN_DOT_EVENT: 0x65,
  /**펜이 입력되었지만 에러가 발생했을 경우, Dot 간의 시간차, 펜 카메라를 통해 들어오는 이미지 밝기, 노출 시간, NADC(ncode처리모듈) 에러코드 등을 반환하는 커맨드 */
  ONLINE_PEN_ERROR_EVENT: 0x68,

  /**펜 DOWN 시 시각, 펜의 타입, 펜의 색상을 반환하는 커맨드, count 요소 추가 */
  ONLINE_NEW_PEN_DOWN_EVENT: 0x69,
  /**펜 UP 시 시각, 전송 및 처리 된 도트, 이미지 개수를 반환하는 커맨드, count 요소 추가 */
  ONLINE_NEW_PEN_UP_EVENT: 0x6a,
  /**현재 펜이 입력된 종이의 정보를 반환하는 커맨드, count 요소 추가 */
  ONLINE_NEW_PAPER_INFO_EVENT: 0x6b,
  /**펜이 입력되었을 때 각종 Dot 정보(좌표 값, 기울기 등)를 반환하는 커맨드, count 요소 추가 */
  ONLINE_NEW_PEN_DOT_EVENT: 0x6c,
  /**펜이 입력되었지만 에러가 발생했을 경우, Dot 간의 시간차, 펜 카메라를 통해 들어오는 이미지 밝기, 노출 시간, NADC(ncode처리모듈) 에러코드 등을 반환하는 커맨드, count 요소 추가 */
  ONLINE_NEW_PEN_ERROR_EVENT: 0x6d,
  /**펜이 hover Mode일 경우 펜의 각종 Dot 정보(좌표 값, 기울기 등)를 반환하는 커맨드*/
  ONLINE_PEN_HOVER_EVENT: 0x6f,

  /**오프라인 데이터의 종이 정보(section, owner, note) 리스트를 요청하는 커맨드 */
  OFFLINE_NOTE_LIST_REQUEST: 0x21,
  /**오프라인 데이터의 종이 정보(section, owner, note) 리스트를 반환하는 커맨드 */
  OFFLINE_NOTE_LIST_RESPONSE: 0xa1,

  /**오프라인 데이터의 종이 정보(page) 리스트를 요청하는 커맨드 */
  OFFLINE_PAGE_LIST_REQUEST: 0x22,
  /**오프라인 데이터의 종이 정보(page) 리스트를 요청하는 커맨드*/
  OFFLINE_PAGE_LIST_RESPONSE: 0xa2,

  /**오프라인 데이터의 필기 정보 전송을 요청하는 커맨드*/
  OFFLINE_DATA_REQUEST: 0x23,
  /**오프라인 데이터의 필기 정보 전송 요청에 대한 응답을 반환하는 커맨드  */
  OFFLINE_DATA_RESPONSE: 0xa3,
  /**오프라인 데이터의 필기 정보를 전송하는 커맨드, PEN->APP */
  OFFLINE_PACKET_REQUEST: 0x24,
  /**오프라인 데이터의 필기 정보 전송에 대한 결과값을 반환하는 커맨드, APP->PEN */
  OFFLINE_PACKET_RESPONSE: 0xa4,

  /**오프라인 데이터의 삭제를 요청하는 커맨드, note 단위 삭제 */
  OFFLINE_DATA_DELETE_REQUEST: 0x25,
  /**오프라인 데이터 삭제 요청에 대한 응답을 반환하는 커맨드 */
  OFFLINE_DATA_DELETE_RESPONSE: 0xa5,

  /**펌웨어 업데이트를 요청하는 커맨드 */
  FIRMWARE_UPLOAD_REQUEST: 0x31,
  /**펌웨어 업데이트 요청에 대한 응답을 반환하는 커맨드 */
  FIRMWARE_UPLOAD_RESPONSE: 0xb1,
  /**펌웨어 업데이트를 위해 파일을 전송받는 커맨드, PEN->APP */
  FIRMWARE_PACKET_REQUEST: 0x32,
  /**펌웨어 업데이트 위해 파일을 전송하는 커맨드, APP->PEN */
  FIRMWARE_PACKET_RESPONSE: 0xb2,

  /**펜에 동록된 프로파일 생성, 삭제, 조회 등을 요청하는 커맨드*/
  PEN_PROFILE_REQUEST: 0x41,
  /**프로파일 요청에 대한 응답을 반환하는 커맨드 */
  PEN_PROFILE_RESPONSE: 0xc1,

  // Only Touch and play
  RES_PDS: 0x73,
  REQ_LOG_INFO: 0x74,
  RES_LOG_INFO: 0xf4,
  REQ_LOG_DATA: 0x75,
  RES_LOG_DATA: 0xf5,
};

export default CMD;
