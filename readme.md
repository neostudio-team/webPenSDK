# pensdk
A Node.js module: Using NeoSmart Pen

## Installation 
``` sh
npm install pensdk
yarn add pensdk
```
## Usage

### Javascript
```javascript
var NeoInk = require('neoink');

NeoInk.dotEvent = (dot) => {
}

NeoInk.pagesEvent = (pages) => {
}
```


### TypeScript
```typescript
import NeoInk, {Dot, PageData, }  from 'neoink'

NeoInk.dotEvent = (dot: Dot) => {
}

NeoInk.pagesEvent = (pages: PageData[]) => {
}
```
