# web_pen_sdk
<p>이 문서는 네오스마트펜을 위한 web_pen_sdk를 사용하기 위해 작성되었습니다.</p>
<p>This document is written to be used the web_pen_sdk for NeoSmartPen.</p>

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
    await api.getNoteImage(pageInfo, setImageBlobUrl);
    const paperSize: PaperSize = await api.extractMarginInfo(pageInfo);
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