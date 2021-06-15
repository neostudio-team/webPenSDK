# pensdk
A Node.js module: Using NeoSmart Pen

## Installation 
``` sh
npm install pensdk
yarn add pensdk
```
## Usage

### Library Set
```javascript
import { PenController, PenMessageType, Dot, SettingType} from "pensdk"

let controller = new PenController()
```

### Step1: Data Parsing from SmartPen
``` javascript
// 1. Create Callback functions
handleDot = (controller, dot) => { };
handleMessage = (controller, type, args) => { };

// 2. Set Callback functions
controller.addCallback(this.handleDot, this.handleMessage);

// 3. Set Data from Pen
controller.putData(u8)
```

### Step2: Set Send Data to SmartPen
```javascript
// Write to Pen
controller.addWrite( (data) => {
  // TODO: Send Data to Pen
  // writeD
})
```
