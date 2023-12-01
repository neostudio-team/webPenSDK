import { ProfileType } from "../API/PenMessageType";
import { Packet } from "../PenCotroller/Packet";
import { toHexString, GetSectionOwner } from "../Util/ByteUtil";

/**
 * 펜에서 반환된, 디바이스 버전(정보) 패킷을 파싱하는 함수
 * @param {Packet} packet
 * @returns
 */
export function VersionInfo(packet: Packet) {
  const DeviceName = packet.GetString(16);
  const FirmwareVersion = packet.GetString(16);
  const ProtocolVersion = packet.GetString(8);
  const SubName = packet.GetString(16);
  const DeviceType = packet.GetShort();
  const MacAddress = toHexString(packet.GetBytes(6));
  const PressureSensorType = packet.GetByte();

  const versionInfo = {
    DeviceName,
    FirmwareVersion,
    ProtocolVersion,
    SubName,
    DeviceType,
    MacAddress,
    PressureSensorType,
  };
  return versionInfo;
}

/**
 * 펜에서 반환된, 펜 설정 정보 패킷을 파싱하는 함수
 * @param {Packet} packet
 * @returns
 */
export function SettingInfo(packet: Packet) {
  // 비밀번호 사용 여부
  let lockyn = packet.GetByte() === 1;
  // 비밀번호 입력 최대 시도 횟수
  let pwdMaxRetryCount = packet.GetByte();
  // 비밀번호 입력 시도 횟수
  let pwdRetryCount = packet.GetByte();
  // 1970년 1월 1일부터 millisecond tick
  let time = packet.GetLong();
  // 사용하지 않을때 자동으로 전원이 종료되는 시간 (단위:분)
  let autoPowerOffTime = packet.GetShort();
  // 최대 필압
  let maxForce = packet.GetShort();
  // 현재 메모리 사용량
  let usedStorage = packet.GetByte();
  // 펜의 뚜껑을 닫아서 펜의 전원을 차단하는 기능 사용 여부
  let penCapOff = packet.GetByte() === 1;
  // 전원이 꺼진 펜에 필기를 시작하면 자동으로 펜의 켜지는 옵션 사용 여부
  let autoPowerON = packet.GetByte() === 1;
  // 사운드 사용여부
  let beep = packet.GetByte() === 1;
  // 호버기능 사용여부
  let hover = packet.GetByte() === 1;
  // 남은 배터리 수치
  let batteryLeft = packet.GetByte();
  // 오프라인 데이터 저장 기능 사용 여부
  let useOffline = packet.GetByte() === 1;
  // 필압 단계 설정 (0~4) 0이 가장 민감
  let fsrStep = packet.GetByte();

  let settingInfo = {
    Locked: lockyn,
    ResetCount: pwdMaxRetryCount,
    RetryCount: pwdRetryCount,
    TimeStamp: time,
    AutoShutdownTime: autoPowerOffTime,
    MaxForce: maxForce,
    Battery: batteryLeft,
    UsedMem: usedStorage,
    UseOfflineData: useOffline,
    AutoPowerOn: autoPowerON,
    PenCapPower: penCapOff,
    HoverMode: hover,
    Beep: beep,
    PenSensitivity: fsrStep,
  };

  return settingInfo;
}

/**
 * 펜에서 반환된, 펜 설정 변경의 성공여부를 파싱하는 함수
 * @param {Packet} packet
 * @returns {{number, boolean}}
 */
export function SettingChange(packet: Packet) {
  let SettingType = packet.GetByte();
  let result = packet.GetByte() === 0;
  return { SettingType, result };
}

/**
 * 펜에서 반환된, 입력된 비밀번호 결과 값을 파싱하는 함수
 * @param {Packet} packet
 * @returns {{number, number, number}} - status: 0 = 비밀번호 필요 / 1 = 비밀번호 불요 or 비밀번호 성공 / 2 = 입력한도초과리셋 / 3 = 오류
 */
export function Password(packet: Packet) {
  let status = packet.GetByte();
  let RetryCount = packet.GetByte();
  let ResetCount = packet.GetByte();
  return { status, RetryCount, ResetCount };
}

/**
 * 펜에서 반환된, 패스워드 변경 결과 값을 파싱하는 함수
 * @param {Packet} packet
 * @returns {{number, number, number}} - status: 0 = 성공 / 1 = 기존비밀번호 불일치 / 2 = 입력한도초과리셋 / 3 = 오류
 */
export function PasswordChange(packet: Packet) {
  let RetryCount = packet.GetByte();
  let ResetCount = packet.GetByte();
  let status = packet.GetByte();
  return { RetryCount, ResetCount, status };
}

/**
 * PDS용 좌표 데이터 파싱하는 함수
 * @param {Packet} packet
 * @returns
 */
export function PDS(packet: Packet) {
  let owner = packet.GetInt();
  let section = packet.GetInt();
  let note = packet.GetInt();
  let page = packet.GetInt();
  let x = packet.GetInt();
  let y = packet.GetInt();
  let fx = packet.GetShort();
  let fy = packet.GetShort();
  return { section, owner, note, page, x, y, fx, fy };
}

/**
 * 펜에서 반환된, 오프라인 데이터의 종이정보(section, owner, note) 리스트를 파싱하는 함수
 * @param {Packet} packet
 * @returns {array}
 */
export function NoteList(packet: Packet) {
  let length = packet.GetShort();
  let result = [];
  for (var i = 0; i < length; i++) {
    let rb = packet.GetBytes(4);
    let [section, owner] = GetSectionOwner(rb);
    let note = packet.GetInt();

    result.push({ Section: section, Owner: owner, Note: note });
  }
  return result;
}

/**
 * 펜에서 반환된, 오프라인 데이터의 종이정보(page) 리스트를 파싱하는 함수
 * @param {Packet} packet
 * @returns {array}
 */
export function PageList(packet: Packet) {
  let rb = packet.GetBytes(4);
  let [section, owner] = GetSectionOwner(rb);
  let note = packet.GetInt();
  let length = packet.GetShort();
  let pages = [];

  for (let i = 0; i < length; i++) {
    pages.push(packet.GetInt());
  }

  let result = {
    Section: section,
    Owner: owner,
    Note: note,
    Pages: pages,
  };
  return result;
}

/**
 * 펜에서 반환된, 프로파일 데이터를 파싱하는 함수
 * @param {Packet} packet
 * @returns - status: 0 = 성공 / 1 = 실패 / 10 = 프로파일 이미 존재 / 11 = 프로파일 없음 / 21 = 프로파일 내 key 없음 / 30 = 권한없음 (비밀번호 틀림) / 40 = 버퍼 크기 맞지 않음
 */
export const ProfileData = (packet: Packet) => {
  const profileName = packet.GetString(8);
  const ptype = packet.GetByte();

  let status = 0;
  let keyCount = 0;
  let key = "";
  let values = [];
  let result: any = {
    profileName: profileName,
    type: "0x" + ptype.toString(16),
  };

  switch (ptype) {
    case ProfileType.CreateProfile:
      status = packet.GetByte();

      result.status = "0x" + status.toString(16);
      break;
    case ProfileType.DeleteProfile:
      status = packet.GetByte();

      result.status = "0x" + status.toString(16);
      break;
    case ProfileType.InfoProfile:
      status = packet.GetByte();
      const allSectorCount = packet.GetShort();
      const sectorSize = packet.GetShort();
      const usedSectorCount = packet.GetShort();
      const usedKeySectorCount = packet.GetShort();

      result.status = "0x" + status.toString(16);
      (result.allSectorCount = allSectorCount),
        (result.sectorSize = sectorSize),
        (result.usedSectorCount = usedSectorCount),
        (result.usedKeySectorCount = usedKeySectorCount);
      break;
    case ProfileType.WriteProfileValue:
      keyCount = packet.GetByte();

      for (let i = 0; i < keyCount; i++) {
        key = packet.GetString(16);
        status = packet.GetByte();
        values.push({ key: key, status: "0x" + status.toString(16) });
      }

      (result.keyCount = keyCount), (result.values = values);
      break;
    case ProfileType.ReadProfileValue:
      keyCount = packet.GetByte();

      for (let i = 0; i < keyCount; i++) {
        key = packet.GetString(16);
        status = packet.GetByte();
        const dataLength = packet.GetShort();
        const data = packet.GetBytes(dataLength);
        const str = String.fromCharCode(...data);
        values.push({ key: key, status: "0x" + status.toString(16), dataLength: dataLength, data: str });
      }

      (result.keyCount = keyCount), (result.values = values);
      break;
    case ProfileType.DeleteProfileValue:
      keyCount = packet.GetByte();

      for (let i = 0; i < keyCount; i++) {
        key = packet.GetString(16);
        status = packet.GetByte();
        values.push({ key: key, status: "0x" + status.toString(16) });
      }

      (result.keyCount = keyCount), (result.values = values);
      break;
  }

  return result;
};
