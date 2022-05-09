type PageInfo = {
  section: number;
  owner: number;
  book: number;
  page: number;
};

type PageInfo2 = {
  section: number;
  owner: number;
  note: number;
  page: number;
}

type PaperSize = {
  Xmin: number;
  Xmax: number;
  Ymin: number;
  Ymax: number;
}

type PaperBase = {
  Xmin: number;
  Ymin: number;
}

type Dot = {
  angle: object;
  color: number;
  dotType: number;
  f: number;
  pageInfo: PageInfo;
  penTipType: number;
  timestamp: number;
  x: number;
  y: number;
}

type ScreenDot = {
  x: number;
  y: number;
}

type View = {
  width: number;
  height: number;
}

type Options = {
  filters: any;
}

type VersionInfo = {
  DeviceName: string;
  FirmwareVersion: string;
  ProtocolVersion: string;
  SubName: string;
  DeviceType: number;
  MacAddress: string;
  PressureSensorType: number;
}

type SettingInfo = {
  Locked: boolean;
  ResetCount: number;
  RetryCount: number;
  Timestamp: number;
  AutoShutdownTime: number;
  MaxForce: number;
  Battery: number;
  UsedMem: number;
  UseOfflineData: boolean;
  AutoPowerOn: boolean;
  PenCapPower: boolean;
  HoverMode: boolean;
  Beep: boolean;
  PenSensitivity: number;
}

export type { 
  PageInfo,
  PageInfo2,
  PaperSize,
  PaperBase,
  Dot,
  ScreenDot,
  View,
  Options,
  VersionInfo,
  SettingInfo
};