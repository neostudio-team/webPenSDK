import { Packet } from '../PenCotroller/Packet';
import {toHexString, GetSectionOwner} from '../Util/ByteUtil'

export function VersionInfo(packet: Packet) {
  const DeviceName = packet.GetString(16);
  const FirmwareVersion = packet.GetString(16);
  const ProtocolVersion = packet.GetString(8);
  const SubName = packet.GetString(16);
  const DeviceType = packet.GetShort();
  const MacAddress = toHexString(packet.GetBytes(6));

  const versionInfo = {
    DeviceName,
    FirmwareVersion,
    ProtocolVersion,
    SubName,
    DeviceType,
    MacAddress
  }
  return versionInfo;
}

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
    Timestamp: time,
    AutoShutdownTime: autoPowerOffTime,
    MaxForce: maxForce,
    Battery: batteryLeft,
    UsedMem: usedStorage,
    UseOfflineData: useOffline,
    AutoPowerOn: autoPowerON,
    PenCapPower: penCapOff,
    HoverMode: hover,
    Beep: beep,
    PenSensitivity: fsrStep
  }

  return settingInfo
}


export function SettingChnage(packet: Packet) {
  let SettingType = packet.GetByte();
  let result = packet.Result === 0x00;
  return {SettingType, result}
}

export function Password(packet: Packet) {
  let status = packet.GetByte();
  let RetryCount = packet.GetByte();
  let ResetCount = packet.GetByte();
  return {status, RetryCount, ResetCount}
}

export function PasswordChange(packet: Packet) {
  let RetryCount = packet.GetByte();
  let ResetCount = packet.GetByte();
  return {RetryCount, ResetCount}
}

export function PDS(packet: Packet) {
  let owner = packet.GetInt()
  let section = packet.GetInt()
  let note = packet.GetInt()
  let page = packet.GetInt()
  let x = packet.GetInt()
  let y = packet.GetInt()
  let fx = packet.GetShort();
  let fy = packet.GetShort();
  return {section, owner, note, page, x, y, fx, fy}
}

export function NoteList(packet: Packet) {
  let length = packet.GetShort();
  let result = [];
  for (var i = 0; i < length; i++) {
    let rb = packet.GetBytes(4);
    let [section, owner] = GetSectionOwner(rb);
    let note = packet.GetInt();

    result.push({ Section: section, Owner: owner, Note: note });
  }
  return result
}

export function PageList(packet: Packet){
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
    Pages: pages
  };
  return result
}