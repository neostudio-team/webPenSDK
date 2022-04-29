# web_pen_sdk
이 문서는 네오스마트펜을 위한 web_pen_sdk를 사용하기 위해 작성되었습니다.<br />
This document is written to be used the web_pen_sdk for NeoSmartPen.

## Installation 
``` sh
# web_pen_sdk setting

$ npm install web_pen_sdk
$ yarn add web_pen_sdk
```

## Description
### **PenHelper**
> scanPen, isSamePage, ncodeToScreen, ncodeToScreen_smartPlate 
### 1. scanPen
블루투스 펜 연결을 위해 디바이스를 스캔하는 로직입니다.
```typescript
// This function scans the device for bluetooth pen connection.
scanPen = async () => {
  ...
}
```

### 2. isSamePage
서로 다른 ncode 페이지 정보(SOBP)를 바탕으로 같은 페이지인지 구별하기 위한 로직입니다. <br />
SOBP는 페이지를 구별하기 정보로서, Section/Owner/Book/Page의 줄임말입니다.
```typescript
// This function is to distinguish whether it is the same page based on different ncode page information (SOBP).
// @param   { PageInfo }
// @param   { PageInfo }
// @returns { boolean }
isSamePage = (page1: PageInfo, page2: PageInfo) => {
  ...
}
```

### 3. ncodeToScreen
일반적인 ncode dot 좌표값을 view에 보여지게 하기 위하여 view size에 맞춰 변환시키는 로직입니다.
```typescript
// This function is to convert the general ncode dot coordinate values ​​according to the view size in order to be shown in the view.
// @param   { Dot }
// @param   { View }
// @param   { PaperSize }
// @returns { ScreenDot }
ncodeToScreen = (dot: Dot, view: View, paperSize: PaperSize) => {
  ...
}
```

### 4. ncodeToScreen_smartPlate
SmartPlate의 ncode dot 좌표값을 view에 보여지게 하기 위하여 view size에 맞춰 변환시키는 로직입니다.
```typescript
// This function is to convert the SmartPlate ncode dot coordinate values ​​according to the view size in order to be shown in the view.
// @param   { Dot }
// @param   { View }
// @param   { number }  <- possible angle value [0', 90', 180', 270']
// @param   { PaperSize }
// @returns { ScreenDot }
ncodeToScreen_smartPlate = (dot: Dot, view: View, angle: number, paperSize: PaperSize) => {
  ...
}
```

### **NoteServer**
> extractMarginInfo, getNoteImage
### 1. extractMarginInfo
펜으로부터 받은 페이지 정보(SOBP)를 바탕으로 nproj로 부터 해당 ncode 페이지의 margin info를 추출하는 로직입니다.
```typescript
// This function is to extract the margin info of the ncode page from nproj based on pageInfo.
// @param   { PageInfo }
// @returns { PaperSize }
const extractMarginInfo = async (pageInfo: PageInfo) => {
  ...
}
```

### 2. getNoteImage
펜으로부터 받은 페이지 정보(SOBP)를 바탕으로 노트의 이미지를 받아오기 위한 로직입니다.
```typescript
// This function is to get the note image based on pageInfo.
// @param   { PageInfo }
// @param   { React.dispatch }
// @returns { boolean }   success -> setImageBlobUrl(imageBlobUrl)
const getNoteImage = async (pageInfo: PageInfo, setImageBlobUrl: any) => {
  ...
}
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

## Usage with react hook
### Library Set
```typescript
import { PenHelper, NoteServer } from 'web_pen_sdk';
```

### Step1: PenHelper.scanPen()을 사용하여 pen 연결을 합니다.
```typescript
// Connect SmartPen to Web service
PenHelper.scanPen();
```

### Step2: 스마트펜으로부터 실시간 dot data를 받아옵니다.
```typescript
// Data Parsing from SmartPen
PenHelper.dotCallback = (mac, dot) => {
  strokeProcess(dot);
}
```

### Step3: NoteServer.extractMarginInfo()를 사용하여 ncode paper의 size 정보를 받아옵니다.
```typescript
// Use NoteServer.extractMarginInfo() function to get size information of the ncode paper.
const [paperSize, setPaperSize] = useState<PaperSize>();

const paperSize: PaperSize = await NoteServer.extractMarginInfo(pageInfo);
```

### Step4: NoteServer.getNoteImage()를 사용하여 note의 image url을 받아옵니다.
```typescript
// Use NoteServer.getNoteImage() function to get image url of the note.
const [imageBlobUrl, setImageBlobUrl] = useState<string>();

await NoteServer.getNoteImage(pageInfo, setImageBlobUrl);
```

### Step5: 스마트펜으로부터 받은 ncode dot 데이터를 view 사이즈에 맞게 변환하여 사용합니다.
```typescript
// Draw on Canvas with SmartPen
// Coordinate Transformation with ncode_dot based on view_size, ncode_size
const view = { width: canvasFb.width, height: canvasFb.height };

// case Default:
const screenDot = PenHelper.ncodeToScreen(dot, view, paperSize);
// case SmartPlate:
const screenDot = PenHelper.ncodeToScreen_smartPlate(dot, view, angle, paperSize)

// Create path data using screenDot
const path = new Path(screenDot.x, screenDot.y);
```

### Step6: Full code
```typescript
const scanPen = () => {
  PenHelper.scanPen();
};
```
```html
<Button onClick={scanPen}></Button>
```
```typescript
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
```typescript
useEffect(() => {
  PenHelper.dotCallback = async (mac, dot) => {
    strokeProcess(dot);
  }
});

const strokeProcess = (dot: Dot) => {
  ...
  const view = { width: canvasFb.width, height: canvasFb.height };

  let screenDot: ScreenDot;
  if (PenHelper.isSamePage(dot.pageInfo, PlateNcode_3)) { // SmartPlate
    screenDot = PenHelper.ncodeToScreen_smartPlate(dot, view, angle, paperSize);
  } else {  // Default
    screenDot = PenHelper.ncodeToScreen(dot, view, paperSize);
  }
  ...
}
```