# Neo smartpen SDK for Web Platform

# Web Pen SDK
This document is written to be used the web_pen_sdk for NeoSmartPen.<br />

## Installation 
``` sh
# web_pen_sdk setting

$ npm install web_pen_sdk
$ yarn add web_pen_sdk
```

## Description
### **PenHelper**
> scanPen, connectDevice, serviceBinding_16, serviceBinding_128, characteristicBinding, disconnect, dotCallback, handleDot, messageCallback, handleMessage, ncodeToScreen, ncodeToScreen_smartPlate, isSamePage

### [펜 연결 설정/해제]

### 1-1. scanPen
블루투스 펜 연결을 위해 디바이스를 스캔하는 로직입니다.
```ts
/** This function scans the device for bluetooth pen connection. */
scanPen = async () => { ... }
```
```ts
// Usage with react hook

const scanPen = () => {
  PenHelper.scanPen();
};

<Button onClick={scanPen}></Button>
```

### 1-2. connectDevice
실제 블루투스 장비와의 연결을 시도합니다.
```ts
connectDevice = async (device: any) => { ... }
```

### 1-3. serviceBinding_16, serviceBinding_128
블루투스 service를 16bit/128bit UUID로 binding 합니다.
```ts
serviceBinding_16 = async (service: any, device: any) => { ... }
serviceBinding_128 = async (service: any, device: any) => { ... }
```

### 1-4. characteristicBinding
블루투스 펜 장비의 연결이 완료된 후 발생되는 펜 event를 처리하기 위해 PenController를 설정합니다. <br />
연결된 펜의 정보, Dot 처리 등 모든 펜 event는 PenController를 통해 처리됩니다. <br />
해당 penController는 PenHelper.pens[] 안에 저장됩니다.
```ts
characteristicBinding = (read: any, write: any, device: any) => { ... }
```
```ts
// PenHelper.ts
this.pens = [penController, penController, ...];

// penController 사용씬 2-1 참조
```


### 1-5. disconnect
블루투스 장비 연결을 해제합니다.
```ts
disconnect = (penController: any) => { ... }
```
```ts
// Usage with react hook

const disconnectPen = () => {
  PenHelper.disconnect(controller);
}
```

### [펜 이벤트 정보]
### 2-1. messageCallback, handleMessage
블루투스 펜의 이벤트를 처리합니다.
```ts
handleMessage = (controller: any, type: any, args: any) => { ... }
```
| Type (Hex) | Title | Description | |
|-----------|-------|-------------| - |
| 98 (0x62) | PEN_DISCONNECTED | 펜 연결해제 | - |
| 1 (0x01) | PEN_AUTHORIZED | 펜 인증성공 | - |
| 2 (0x02) | PEN_PASSWORD_REQUEST | 비밀번호 요청 | - |
| 17 (0x11) | PEN_SETTING_INFO | 펜의 상태정보(배터리, 메모리 등) | 펜 충전시 배터리정보 -> 128 |
| 18 (0x12) | PEN_SETUP_SUCCESS | 펜 연결 후 초기설정 성공 | - |
| 19 (0x13) | PEN_SETUP_FAILURE | 펜 연결 후 초기설정 실패 | - |
| 82 (0x52) | PASSWORD_SETUP_SUCCESS | 패스워드 설정 성공 | - |
| 83 (0x53) | PASSWORD_SETUP_FAILURE | 패스워드 설정 실패 | - |
| 99 (0x63) | EVENT_LOW_BATTERY | 배터리 잔량 부족시 이벤트 | - |
| 100 (0x64) | EVENT_POWER_OFF | 전원 OFF 이벤트 | - |
| 34 (0x22) | PEN_FW_UPGRADE_STATUS | 펜 펌웨어 업그레이드 상태 | - |
| 35 (0x23) | PEN_FW_UPGRADE_SUCCESS | 펜 펌웨어 업그레이드 성공 | - |
| 36 (0x24) | PEN_FW_UPGRADE_FAILURE | 펜 펌웨어 업드레이드 실패 | - |
| 37 (0x25) | PEN_FW_UPGRADE_SUSPEND | 펜 펌웨어 업그레이드 중단 | - |
| 48 (0x30) | OFFLINE_DATA_NOTE_LIST | 오프라인 데이터 노트 리스트 | - |
| 49 (0x31) | OFFLINE_DATA_PAGE_LIST | 오프라인 데이터 페이지 리스트 | - |
| 50 (0x32) | OFFLINE_DATA_SEND_START | 오프라인 데이터 보내기 시작 | - |
| 51 (0x33) | OFFLINE_DATA_SEND_STATUS | 오프라인 데이터 보내는 상태 | - |
| 52 (0x34) | OFFLINE_DATA_SEND_SUCCESS | 오프라인 데이터 보내기 성공 | - |
| 53 (0x35) | OFFLINE_DATA_SEND_FAILURE | 오프라인 데이터 보내기 실패 | - |
| 84 (0x54) | PEN_CONNECTION_FAILURE_BTDUPLICATE | 중복되는 블루투스 펜 연결 시도시 실패 | - |
| 193 (0xc1) | PEN_PROFILE | 펜의 프로필 | - |
| 115 (0x73) | RES_PDS | 펜 PDS | - |
| 104 (0x68) | EVENT_DOT_ERROR | 펜 Dot 이벤트 에러 | - |
| 244 (0xf4) | RES_LOG_INFO | 펜 로그 정보 | - |
| 245 (0xf5) | RES_LOG_DATA | 펜 로그 데이터 | - |
| 165 (0xa5) | OFFLINE_DATA_DELETE_RESPONSE | 오프라인 데이터 삭제 상태 | - |

``` ts
// Usage with react hook

const [controller, setController] = useState();
const [penVersionInfo, setPenVersionInfo] = useState();
const [battery, setBattery] = useState();

useEffect(() => {
  PenHelper.messageCallback = async (mac, type, args) => {
    messageProcess(mac, type, args);
  }
});

const messageProcess = (mac, type, args) => {
  switch(type) {
    case PenMessageType.PEN_SETTING_INFO:
      const _controller = PenHelper.pens.filter((c) => c.info.MacAddress === mac)[0];
      setController(_controller);  // 해당 펜의 controller를 등록해준다.
      setBattery(args.Battery);  // 배터리 상태정보를 저장 -> 충전중일 때 128로 표시
      ...
    case PenMessageType.PEN_DISCONNECTED:  // 펜 연결해제시 모든 상태값 초기화
      setController(null);
      setPenInfo(null);
      setBattery(null);
    case PenMessageType.PEN_PASSWORD_REQUEST: ...  // 패스워드 요청시 처리
      onPasswordRequired(args);
    case PenMessageType.PEN_SETUP_SUCCESS:  // 팬 연결 성공시 처리
      if (controller) {
        setPenVersionInfo(controller.info);
      }
      ...
  }
}

...

const onPasswordRequired = (args: any) => {
  const password = input();
  ...
  if (args.RetryCount >= 10) {
    alert('펜의 모든정보가 초기화 됩니다.');
  }
  ...
  controller.InputPassword(password);  // 등록된 펜 controller를 사용하여 비밀번호를 전달한다.
}
...
```

### [펜 Dot 처리]
### 3-1. dotCallback, handleDot
펜에서 넘어온 dot 데이터는 penController에 등록된 callback 함수인 handleDot을 통해 처리됩니다.
```ts
handleDot = (controller: any, args: any) => { ... }
```

### 3-2. ncodeToScreen
일반적인 ncode dot 좌표값을 view에 보여지게 하기 위하여 view size에 맞춰 변환시키는 로직입니다.
```ts
/**
 * This function is to convert the general ncode dot coordinate values ​​according to the view size in order to be shown in the view.
 * 
 * @param {Dot} dot
 * @param {View} view
 * @param {PaperSize} paperSize
 * @returns {ScreenDot}
 */
ncodeToScreen = (dot: Dot, view: View, paperSize: PaperSize) => { 
  ... 
}
```

### 3-3. ncodeToScreen_smartPlate
SmartPlate의 ncode dot 좌표값을 view에 보여지게 하기 위하여 view size에 맞춰 변환시키는 로직입니다.
```ts
/**
 * This function is to convert the SmartPlate ncode dot coordinate values ​​according to the view size in order to be shown in the view.
 * 
 * @param {Dot} dot
 * @param {View} view
 * @param {number} angle - possible angle value [0', 90', 180', 270']
 * @param {PaperSize} paperSize
 * @returns {ScreenDot}
 */
ncodeToScreen_smartPlate = (dot: Dot, view: View, angle: number, paperSize: PaperSize) => {
  ...
}
```

```ts
// Usage with react hook

useEffect(() => {
  PenHelper.dotCallback = async (mac, dot) => {
    strokeProcess(dot);
  }
});

const strokeProcess = (dot: Dot) => {
  ...
  const view = { width: canvasFb.width, height: canvasFb.height };

  let screenDot: ScreenDot;
  if (PenHelper.isSamePage(dot.pageInfo, PlateNcode_3)) {  // SmartPlate
    screenDot = PenHelper.ncodeToScreen_smartPlate(dot, view, angle, paperSize);
  } else {  // Default
    screenDot = PenHelper.ncodeToScreen(dot, view, paperSize);
  }
  ...
}
```

### [Additional]
### 4. isSamePage
서로 다른 ncode 페이지 정보(SOBP)를 바탕으로 같은 페이지인지 구별하기 위한 로직입니다. <br />
SOBP는 페이지를 구별하기 위한 정보로서, Section/Owner/Book/Page의 줄임말입니다.
```ts
/**
 * This function is to distinguish whether it is the same page based on different ncode page information (SOBP).
 * 
 * @param {PageInfo} page1
 * @param {PageInfo} page2
 * @returns {boolean}
 */
isSamePage = (page1: PageInfo, page2: PageInfo) => {
  ...
}
```



### **NoteServer**
> extractMarginInfo, getNoteImage
### 1. extractMarginInfo
펜으로부터 받은 페이지 정보(SOBP)를 바탕으로 nproj로 부터 해당 ncode 페이지의 margin info를 추출하는 로직입니다.
```ts
/**
 * This function is to extract the margin info of the ncode page from nproj based on pageInfo.
 * 
 * @param {PageInfo} pageInfo
 * @returns {PaperSize}
 */
const extractMarginInfo = async (pageInfo: PageInfo) => {
  ...
}
```

### 2. getNoteImage
펜으로부터 받은 페이지 정보(SOBP)를 바탕으로 노트의 이미지를 받아오기 위한 로직입니다.
```ts
/**
 * This function is to get the note image based on pageInfo.
 * 
 * @param {PageInfo} pageInfo
 * @param {React.dispatch} setImageBlobUrl
 * @returns {boolean} - success -> setImageBlobUrl(imageBlobUrl)
 */
const getNoteImage = async (pageInfo: PageInfo, setImageBlobUrl: any) => {
  ...
}
```

```ts
// Usage with react hook

const [imageBlobUrl, setImageBlobUrl] = useState<string>();
const [paperSize, setPaperSize] = useState<PaperSize>();

useEffect(() => {
  async function getNoteImageUsingAPI(pageInfo) {
    await NoteServer.getNoteImage(pageInfo, setImageBlobUrl);
    const paperSize: PaperSize = await NoteServer.extractMarginInfo(pageInfo);
    setPaperSize(paperSize);
  }

  if (pageInfo) {
    getNoteImageUsingAPI(pageInfo);
  }
}, [pageInfo]);
```

### **PenController**
> RequestVersionInfo, SetPassword, InputPassword, RequestPenStatus, SetRtcTime, SetAutoPowerOffTime, SetPenCapPowerOnOffEnable,
SetAutoPowerOnEnable, SetBeepSoundEnable, SetHoverEnable, SetOfflineDataEnable, SetColor, RequestAvailableNotes, RequestOfflineNoteList, RequestOfflinePageList, RequestOfflineData, RequestOfflineDelete

| Methods | Parameters |Description |
| --- | --- |--- |
| RequestVersionInfo | | 펜의 현재 버전을 요청 |
| SetPassword | oldone: string, newone: string | 펜에 설정된 비밀번호를 변경 요청 |
| InputPassword | password: string | 펜에 비밀번호를 전송 | 
| RequestPenStatus | | 펜의 각종 설정 확인을 요청 |
| SetRtcTime | | 펜에 설정된 시각을 현재 시각으로 변경 요청 |
| SetAutoPowerOffTime | minute: number | 펜에 설정된 자동종료 시간을 변경 요청 ( 최대 3600 분 ) | 
| SetPenCapPowerOnOffEnable | enable: boolean | 펜에 설정된 펜 뚜껑을 이용한 전원 ON/OFF 기능 변경 요청 |
| SetAutoPowerOnEnable | enable: boolean | 펜에 설정된 펜 뚜껑 혹은 필기를 이용한 전원 ON 기능 변경 요청 |
| SetBeepSoundEnable | enable: boolean | 펜에 설정된 비프음 기능 변경 요청 |
| SetHoverEnable | enable: boolean | 펜에 설정된 호버 기능 변경 요청 <br/> ( 호버 : 필기 위치 가늠을 위한 시각적 Dot 표시 기능) |
| SetOfflineDataEnable | enable: boolean | 펜에 설정된 오프라인 필기 데이터 저장 기능 변경 요청 |
| SetColor | color: number | 펜에 설정된 LED 색상 변경 요청 ( argb ) |
| RequestAvailableNotes | sections: number[ ], owners: number[ ], <br/> notes: number[ ] \| null| 펜에 실시간 필기 데이터에 대한 전송을 요청 <br/> ( notes 가 null 일 경우 노트 구분 없이 요청 ) |
| RequestOfflineNoteList | section: number, owner: number | 펜에 저장된 오프라인 필기 데이터의 페이지 정보(book)를 요청 <br/> ( SO 가 0 일 경우 모든 note 리스트 반환 ) |
| RequestOfflinePageList | section: number, owner: number, <br/> note: number | 펜에 저장된 오프라인 필기 데이터의 페이지 정보(page)를 요청  <br/> ( SOB 가 일치하는 한 노트의 page ) |
| RequestOfflineData | section: number, owner: number, <br/>note: number,  deleteOnFinished: boolean,<br/> pages: number[ ] | 펜에 저장된 오프라인 필기 데이터를 요청 <br/> ( P 가 빈 배열일 경우 노트 내 모든 page 요청 ) <br/> ( deleteOnFinished 가 true일 경우 전송 완료된 데이터 삭제 )|
| RequestOfflineDelete | section: number, owner: number, <br/> notes: number[ ] | 펜에 저장된 오프라인 필기 데이터에 대한 삭제를 요청 |

## 전체적인 Flow
### Library Set
```ts
import { PenHelper, NoteServer, PenMessageType } from 'web_pen_sdk';
```

### Step1: PenHelper.scanPen()을 사용하여 pen 연결을 합니다.
```ts
/** Connect SmartPen to Web service */
PenHelper.scanPen();
```

### Step2: 펜에 발생되는 이벤트(연결, 배터리정보 등)를 처리합니다.
```ts
useEffect(() => {
  PenHelper.messageCallback = async (mac, type, args) => {
    messageProcess(mac, type, args)
  }
});

const messageProcess = (mac, type, args) => {
  switch(type) {
    case PenMessageType.x:
    ...
  }
}
```

### Step3: 펜으로부터 실시간 dot data를 받아옵니다.
```ts
/** Data Parsing from SmartPen */
PenHelper.dotCallback = (mac, dot) => {
  strokeProcess(dot);
}

const strokeProcess = (dot: Dot) => {
  ...
}
```

### Step4: NoteServer.extractMarginInfo()를 사용하여 ncode paper의 size 정보를 받아옵니다.
```ts
/** Use NoteServer.extractMarginInfo() function to get size information of the ncode paper. */
const [paperSize, setPaperSize] = useState<PaperSize>();

const paperSize: PaperSize = await NoteServer.extractMarginInfo(pageInfo);
```

### Step5: NoteServer.getNoteImage()를 사용하여 note의 image url을 받아옵니다.
```ts
/** Use NoteServer.getNoteImage() function to get image url of the note. */
const [imageBlobUrl, setImageBlobUrl] = useState<string>();

await NoteServer.getNoteImage(pageInfo, setImageBlobUrl);
```

### Step6: 스마트펜으로부터 받은 ncode dot 데이터를 view 사이즈에 맞게 변환하여 사용합니다.
```ts
/**
 * Draw on Canvas with SmartPen
 * Coordinate Transformation with ncode_dot based on view_size, ncode_size
 */ 
const strokeProcess = (dot: Dot) => {
  const view = { width: canvasFb.width, height: canvasFb.height };

  // case Default:
  const screenDot = PenHelper.ncodeToScreen(dot, view, paperSize);
  // case SmartPlate:
  const screenDot = PenHelper.ncodeToScreen_smartPlate(dot, view, angle, paperSize)

  /** Create path data using screenDot */
const path = new Path(screenDot.x, screenDot.y);
}
```

<br />

## 🐾 Sample Page
> https://github.com/MHCHOI3/web-sdk-sample2

## 📑 web_pen_sdk 공식문서
> ### [Google Docs](https://docs.google.com/document/d/12ZSPQ-CVEOq4yxvNn2jcI9L_SZ01zJkMvbWBVfJCHWQ/edit?usp=sharing)

## 📜 License
#### **Copyright(c) 2022, NeoLAB Convergence INC. No license allowed.**

<br />

Release Note
=====
**~2022. 05. 05.** (MHCHOI)
-----
### Updates
- web_pen_sdk 패키지 배포
- Sample page 구성

**2022. 05. 06.** (MHCHOI)
-----
### New Features
- **Pen Event Handler** - 펜에서 발생되는 이벤트(연결, 해제, 패스워드 요구 등)를 처리하는 로직 추가
### Updates
- Pen Event Handler 추가에 따른 readme 업데이트
- Sample Page에 펜 연결해제 기능 추가, 배터리 정보 표시될 수 있도록 업데이트
- 펜 충전시 배터리 상태정보는 128을 가진다. -> 추가 설명 업데이트

**2022. 05. 09.** (WONHO)
-----
### New Features
- **SettingInfo, VersionInfo** type declaration
### Updates
- SettingInfo, VersionInfo type 정의에 따른 코드 수정
- PenHelper 안에 정의된 any type 수정
