import $ from 'jquery';
import { Paper } from '../Util/type';
import PageInfo from './PageInfo';
import GenericPuiNproj from "./nproj/note_3_1013_1.nproj";

const PU_TO_NU = 0.148809523809524;

const predefinedPuiGroup = [GenericPuiNproj];

let _puiInstance: PUIController = null;

type PuiSymbolType = {
  sobp: PageInfo,
  command: string,

  type: "Rectangle" | "Ellipse" | "Polygon", 
  rect_nu?: {
    left: number,
    top: number,
    width: number,
    height: number,
  },
  ellipse_nu?: {
    x: number,
    y: number,
    width: number,
    height: number,
  }
  polygon?: { x: number, y: number }[],

}

function makeNPageIdStr(pageInfo: PageInfo, separator = ".") {
  if (pageInfo) {
    const { section, owner, book, page } = pageInfo;

    if (page !== undefined)
      return `${section}${separator}${owner}${separator}${book}${separator}${page}`;

    if (book !== undefined)
      return `${section}${separator}${owner}${separator}${book}`;

    if (owner !== undefined)
      return `${section}${separator}${owner}`;

    if (section !== undefined)
      return `${section}`;

    return `${section}${separator}${owner}${separator}${book}${separator}${page}`;
  }
  return `${pageInfo}`;
}

function insidePolygon(point: { x: number, y: number }, vs: { x: number, y: number }[]) {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

  const { x, y } = point;

  let inside = false;
  for (let i = 0, j = vs.length - 1, l = vs.length; i < l; j = i++) {
    const { x: xi, y: yi } = vs[i];
    const { x: xj, y: yj } = vs[j];

    const intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

function insideRectangle(point: { x: number, y: number }, rc: { left: number, top: number, width: number, height: number }) {
  return (point.x >= rc.left) && (point.x <= rc.left + rc.width) &&
    (point.y >= rc.top) && (point.y <= rc.top + rc.height);
}

function insideEllipse(point: { x: number, y: number }, el: { x: number, y: number, width: number, height: number }) {
  const p = Math.pow((point.x - el.x), 2) / Math.pow(el.width, 2) + Math.pow((point.y - el.y), 2) / Math.pow(el.height, 2);
  return p <= 1;
}



export default class PUIController {

  private _pageSymbols: { [sobp_str: string]: PuiSymbolType[] } = {};


  private _ready: Promise<void>;

  constructor() {
    this._ready = this.readPredefinedSymbols();
  }
  
  static getInstance() {
    if (!_puiInstance) {
      _puiInstance = new PUIController();
    }

    return _puiInstance;
  }

  private readPredefinedSymbols = async () => {

    for (const url of predefinedPuiGroup) {
      // nproj 파일에서 symbol을 받는다.
      const symbols = await this.getPuiXML(url);

      // 해당 페이지에 symbol을 넣고,
      for (const s of symbols) {
        const idStr = makeNPageIdStr(s.sobp);
        if (!this._pageSymbols[idStr]) this._pageSymbols[idStr] = [];
        this._pageSymbols[idStr].push(s);

        // if (!commands.includes(s.command)) commands.push(s.command);
      }
    }  
  }

  public getPuiCommand = async (sobp: Paper,  x: number, y: number) => {
    await this._ready;
    const command = this.getPuiCommand_sync(sobp, { x: x, y: y });

    return command;
  }


  private getPuiCommand_sync = (sobp: Paper, point_nu: { x: number, y: number }) => {
    const pageInfo = {section: sobp.section, owner: sobp.owner, book: sobp.note, page: sobp.page}
    const pageSymbols = this._pageSymbols[makeNPageIdStr(pageInfo)];
    if (!pageSymbols) return undefined;

    for (const s of pageSymbols) {
      switch (s.type) {
        case "Rectangle": {
          if (insideRectangle(point_nu, s.rect_nu))
            return s.command;
          break;
        }

        case "Ellipse": {
          if (insideEllipse(point_nu, s.ellipse_nu))
            return s.command;
          break;
        }

        case "Polygon": {
          if (insidePolygon(point_nu, s.polygon)) {
            return s.command;
          }

          break;
        }
      }
    }

    return undefined;
  }

  get ready() {
    return this._ready;
  }

  private getPuiXML = async (url: string) => {
    const symbols: PuiSymbolType[] = [];

    const res = await fetch(url);
    const nprojXml = await res.text();
    // console.log(nprojXml);

    // book 정보
    const $bookXml = $(nprojXml).find("book");
    const section = parseInt($bookXml.find("section").text());
    const owner = parseInt($bookXml.find("owner").text());
    const book = parseInt($bookXml.find("code").text());
    const startPage = parseInt($bookXml.find("start_page").text());

    // page 정보
    const $pagesXml = $(nprojXml).find("pages");
    const numPages = parseInt($pagesXml.attr("count"));

    // symbol 정보
    const $symbols = $(nprojXml).find("symbols");
    const symbolXml = $symbols.find("symbol");

    $(symbolXml).each(function (index, sym) {
      // console.log(sym.outerHTML);

      const pageDelta = parseInt($(sym).attr("page"));
      const type: string = $(sym).attr("type"); // 여기서는 Rectangle만 취급한다.
      const x = parseFloat($(sym).attr("x"));
      const y = parseFloat($(sym).attr("y"));
      const width = parseFloat($(sym).attr("width"));
      const height = parseFloat($(sym).attr("height"));

      const command: string = $(sym).find("command").attr("param");

      const page = pageDelta + startPage;
      const sobp = { section, owner, book, page };

      switch (type) {
        case "Rectangle": {
          const puiSymbol: PuiSymbolType = {
            type,
            command,
            sobp,
            rect_nu: {
              left: x * PU_TO_NU,
              top: y * PU_TO_NU,
              width: width * PU_TO_NU,
              height: height * PU_TO_NU,
            },
          };
          symbols.push(puiSymbol);
          break;
        }

        case "Ellipse": {
          const puiSymbol: PuiSymbolType = {
            type,
            command,
            sobp,
            ellipse_nu: {
              x: x * PU_TO_NU,
              y: y * PU_TO_NU,
              width: width * PU_TO_NU,
              height: height * PU_TO_NU,
            },
          };
          symbols.push(puiSymbol);
          break;
        }

        default: {
          throw new Error(`symbol type(${type} is not "Rectangle" nor "Ellipse"`);
        }
      }
    });

    return symbols;
  }
}
