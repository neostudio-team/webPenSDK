import PenController from './PenController';
import PenMessageType from '../API/PenMessageType';
import { Dot, PageInfo, PageInfo2, View, Options } from '../Util/type';

const serviceUuid = parseInt('0x19F1');
const characteristicUuidNoti = parseInt('0x2BA1');
const characteristicUuidWrite = parseInt('0x2BA0');

const PEN_SERVICE_UUID_128 = '4f99f138-9d53-5bfa-9e50-b147491afe68';
const PEN_CHARACTERISTICS_NOTIFICATION_UUID_128 = '64cd86b1-2256-5aeb-9f04-2caf6c60ae57';
const PEN_CHARACTERISTICS_WRITE_UUID_128 = '8bc8cc7d-88ca-56b0-af9a-9bf514d0d61a';

class PenHelper {
  pens: any;
  dotCallback: any;
  pageCallback: any;
  messageCallback: any;
  d: PageInfo2;
  dotStorage: any;
  mac: string;
  isPlate: boolean;
  plateMode: string;
  writecharacteristic: any;

  constructor() {
    this.pens = []; // PenController Array
    this.dotCallback = null;
    this.pageCallback = null;
    this.messageCallback = null;
    this.d = { section: 0, owner: 0, note: 0, page: 0 };
    this.dotStorage = {};
    this.mac = '';
    this.isPlate = false;
    this.plateMode = '';
  }

  isConnected = () => {
    return this.writecharacteristic ? true : false;
  }

  // MARK: Dot Event Callback
  handleDot = (controller: any, args: any) => {
    const mac = controller.info.MacAddress;
    this.mac = mac;
    const dot = args;
    
    // platePage 인지 확인 후 isPlate 값 설정
    const pageInfo = dot.pageInfo;
    this.isPlate = false;
    if (this.isPlatePaper(pageInfo)) {
      this.isPlate = true;
    }
    dot.isPlate = this.isPlate;

    /**
     * 기존 dot을 args.Dot으로 받아오는 코드 수정
     * Dot type 재정의
     * 0(Down), 1(Move), 2(Up), 3(Hover)
     * 
     */
    if (dot.DotType === 0) { // Down
      if (this.d.section !== dot.section || this.d.owner !== dot.owner  || this.d.note !== dot.note || this.d.page !== dot.page) {
        if (this.pageCallback) { 
          this.pageCallback(dot);
        }
        this.d = dot;
        this.dotCallback = null;
      }
    } else if (dot.DotType === 1) { // Move

    } else if (dot.DotType === 2) { // Up
      
    }
    
    if (this.dotCallback) {
      this.dotCallback(mac, dot);
    } else {
      const id = dot.section + '_' + dot.owner + '_' + dot.note + '_' + dot.page;
      if (this.dotStorage[id]) {
        this.dotStorage[id].push(dot);
      } else {
        this.dotStorage[id] = [];
        this.dotStorage[id].push(dot);
      }
    }
  };

  // MARK: Pen Event Callback
  handleMessage = (controller: any, type: any, args: any) => {
    const mac = controller.info.MacAddress;
    
    switch (type) {
      case PenMessageType.PEN_AUTHORIZED:
        console.log('PenHelper PEN_AUTHORIZED');
        controller.RequestAvailableNotes();
        break;
      default:
        break;
    }

    if (this.messageCallback) {
      this.messageCallback(mac, type, args);
    }
  };

  scanPen = async () => {
    if (await this.notSupportBLE()) return;

    const filters = [{ services: [serviceUuid] }, { services: [PEN_SERVICE_UUID_128] }];
    const options: Options = { filters: undefined };
    options.filters = filters;

    try {
      const device = await navigator.bluetooth.requestDevice(options);
      console.log('> Name:             ' + device.name);
      console.log('> Id:               ' + device.id);
      console.log('> Connected:        ' + device.gatt?.connected);
      this.connectDevice(device);
    } catch (err) {
      console.log('err', err);
    }
  };

  notSupportBLE = async () => {
    if (!navigator.bluetooth) {
      alert('Bluetooth not support');
      return true;
    }

    const isEnableBle = await navigator.bluetooth.getAvailability();
    if (!isEnableBle) {
      alert('Bluetooth not support');
      return true;
    }
    return false;
  };

  connectDevice = async (device: any) => {
    if (!device) return;

    console.log('Connect start', device);
    try {
      const service = await device.gatt.connect();
      console.log('service', service);
      this.serviceBinding_16(service, device);
      this.serviceBinding_128(service, device);
    } catch (err) {
      console.log('err conect', err);
    }
  };

  serviceBinding_16 = async (service: any, device: any) => {
    try {
      const service_16 = await service.getPrimaryService(serviceUuid);
      console.log('service_16', service_16);
      const characteristicNoti = await service_16.getCharacteristic(characteristicUuidNoti);
      const characteristicWrite = await service_16.getCharacteristic(characteristicUuidWrite);
      this.characteristicBinding(characteristicNoti,characteristicWrite, device);
    } catch (err) {
      console.log('not support service uuid', err);
    }
  };

  serviceBinding_128 = async (service: any, device: any) => {
    try {
      const service_128 = await service.getPrimaryService(PEN_SERVICE_UUID_128);
      console.log('service_128', service_128);
      const characteristicNoti = await service_128.getCharacteristic(PEN_CHARACTERISTICS_NOTIFICATION_UUID_128);
      const characteristicWrite = await service_128.getCharacteristic(PEN_CHARACTERISTICS_WRITE_UUID_128);
      this.characteristicBinding(characteristicNoti,characteristicWrite , device);
    } catch (err) {
      console.log('not support service uuid', err);
    }
  };

  characteristicBinding = (read: any, write: any, device: any) => {
    let controller = new PenController();
    // controller.device = device;
    // Read Set
    read.startNotifications();
    read.addEventListener('characteristicvaluechanged', (event: any) => {
      const value = event.target.value;
      let a: any = [];
      for (let i = 0; i < value.byteLength; i++) {
        a.push(value.getUint8(i));
      }
      controller.putData(a);
    });
    controller.OnConnected();

    // Write Set
    controller.addWrite((data) => {
      write.writeValue(data).then(() => {
        console.log('write success CMD: ', '0x' + data[1].toString(16), data[1]);
      }).catch((err: any) => {
        console.log('write Error', err);
      });
    })
    controller.SetHoverEnable(true);

    // Call back Event Set
    controller.addCallback(this.handleDot, this.handleMessage);
    // device Status Set
    device.addEventListener('gattserverdisconnected', this.onDisconnected);
    this.pens.push(controller);
  }

  // disconnected Callback
  onDisconnected = (event: any) => {
    console.log('device disconnect', event);
    console.log('device id',  event.currentTarget.id, this.pens);
    this.pens = this.pens.filter((p: { device: { id: any; }; }) => p.device.id !== event.currentTarget.id);
    console.log('pen list', this.pens);
  }

  // disconnect Action
  disconnect = (penController: any) => {
    penController.device.gatt.disconnect();
  }

  isPlatePaper = (pageInfo: PageInfo) => {
    const { owner, book } = pageInfo;
    if (owner === 1013 && book === 2) {
      return true;
    }
    return false;
  }

  isSamePage = (page1: PageInfo, page2: PageInfo) => {
    if (page1 === undefined && page2 === undefined) return true;
    if (page1 && !page2) return false;
    if (!page1 && page2) return false;

    if (page1.page !== page2.page || page1.book !== page2.book || page1.owner !== page2.owner || page1.section !== page2.section) {
      return false;
    }
    return true;
  }

  ncodeToScreen = (dot: Dot, view: View, ncodeSize: any) => {
    /**
     * paperBase: ncode paper의 margin 값
     * ncodeWidth: ncode의 가로길이
     * ncodeHeight: ncode의 세로길이
     * 
     */
    let paperBase, ncodeWidth, ncodeHeight;
    paperBase = { Xmin: ncodeSize.Xmin, Ymin: ncodeSize.Ymin };
    ncodeWidth = ncodeSize.Xmax - ncodeSize.Xmin;
    ncodeHeight = ncodeSize.Ymax - ncodeSize.Ymin;

    /**
     * view(Canvas)에 보여질수 있는 좌표값을 구하기 위해 ncode dot 좌표를 계산하는 로직
     * ncode_size : ncode_dot_position = view_size : view_dot_position
     * view_dot_position = (ncode_dot_position * view_size) / ncode_size
     * 따라서, ncode_dot_position에 각각의 width, height ratio를 곱해주면 된다.
     * 
     * widthRatio = view.width / ncodeWidth
     * heightRatio = view.height / ncodeHeight
     * 
     */

    const widthRatio = view.width / ncodeWidth;
    const heightRatio = view.height / ncodeHeight;
    // dot의 기본 margin 값인 Xmin, Ymin 값을 빼주도록 한다.
    const x = (dot.x - paperBase.Xmin) * widthRatio;
    const y = (dot.y - paperBase.Ymin) * heightRatio;
    
    return { x, y };
  }

  /**
   * SmartPlate를 위한 ncode dot 변환 로직
   * angle 값을 받아 해당 angle에 맞는 dot 좌표를 return 해준다.
   * 0', 180' -> landscape
   * 90', 270' -> portrait
   * 
   */
  ncodeToScreen_smartPlate = (dot: Dot, view: View, angle: number, ncodeSize: any) => {
    let paperBase, ncodeWidth, ncodeHeight;
    paperBase = { Xmin: ncodeSize.Xmin, Ymin: ncodeSize.Ymin };
    ncodeWidth = ncodeSize.Xmax - ncodeSize.Xmin;
    ncodeHeight = ncodeSize.Ymax - ncodeSize.Ymin;

    let plateMode = "landscape";
    if (angle === 90 || angle === 270){
      plateMode = "portrait";
    }

    // plateMode 가 portrait 일때는 ncode의 width <-> height swap
    if (plateMode === "portrait") {
      const tmp = ncodeHeight;
      ncodeHeight = ncodeWidth;
      ncodeWidth = tmp;
    }

    let nx = Math.cos(Math.PI/180 * angle) * dot.x - Math.sin(Math.PI/180 * angle) * dot.y;
    let ny = Math.sin(Math.PI/180 * angle) * dot.x + Math.cos(Math.PI/180 * angle) * dot.y;

    if (angle === 0) {
      paperBase.Xmin = 0;
      paperBase.Ymin = 0;
    } else if (angle === 90){
      paperBase.Ymin = 0;
      nx += ncodeSize.Ymax;
    } else if (angle === 180) {
      nx += ncodeSize.Xmax;
      ny += ncodeSize.Ymax;      
    } else if (angle === 270) {
      paperBase.Xmin = 0;
      ny += ncodeSize.Xmax;
    }

    const widthRatio = view.width / ncodeWidth;
    const heightRatio = view.height / ncodeHeight;
    const x = (nx - paperBase.Xmin) * widthRatio;
    const y = (ny - paperBase.Ymin) * heightRatio;

    return { x, y };
  }
}

const shared = new PenHelper();
export default shared;
