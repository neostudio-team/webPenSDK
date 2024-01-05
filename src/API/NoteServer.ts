import { PageInfo } from "../Util/type";
import { initializeApp } from "firebase/app";
import * as NLog from "../Util/NLog";

import { getStorage, ref, getDownloadURL } from "firebase/storage";
import JSZip from "jszip";
import PUIController from "./PUIController";

const firebaseConfig = {
  apiKey: "AIzaSyAY7MrI37TvkDerHsShcvOsueDpi4TGihw",
  authDomain: "neonotes2-d0880.firebaseapp.com",
  databaseURL: "https://neonotes2-d0880.firebaseio.com",
  projectId: "neonotes2-d0880",
  storageBucket: "neonotes2-d0880.appspot.com",
  messagingSenderId: "693506452621",
  appId: "1:693506452621:web:8b6600b884b8822d",
  measurementId: "G-44CKW86QHE",
};

// Ncode Formula
const NCODE_SIZE_IN_INCH = (8 * 7) / 600;
const POINT_72DPI_SIZE_IN_INCH = 1 / 72;

const point72ToNcode = (p: number) => {
  const ratio = NCODE_SIZE_IN_INCH / POINT_72DPI_SIZE_IN_INCH;
  return p / ratio;
};

/**
 * Set Note Page PUI in PUIController
 */
const setNprojInPuiController = async (url: string | null, pageInfo: PageInfo) => {
  let nprojUrl = url;
  if (!nprojUrl) {
    const sobStr = `${pageInfo.section}_${pageInfo.owner}_${pageInfo.book}.nproj`;
  
    const fbApp = initializeApp(firebaseConfig);
    const storage = getStorage(fbApp);
  
    nprojUrl = await getDownloadURL(ref(storage, `nproj/${sobStr}`));
  }

  PUIController.getInstance().fetchOnlyPageSymbols(nprojUrl, pageInfo);
};

/**
 * Calculate page margin info
 * -> define X(min/max), Y(min,max)
 */
const extractMarginInfo = async (pageInfo: PageInfo) => {
  const sobStr = `${pageInfo.section}_${pageInfo.owner}_${pageInfo.book}.nproj`;
  const page = pageInfo.page;

  const fbApp = initializeApp(firebaseConfig);
  const storage = getStorage(fbApp);

  return new Promise(async function (resolve, reject) {
    await getDownloadURL(ref(storage, `nproj/${sobStr}`)).then(async (url: any) => {
      const xhr: any = new XMLHttpRequest();
      xhr.responseType = "xml";
      xhr.onload = async (event: any) => {
        const xml = xhr.response;
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");

        const section = doc.children[0].getElementsByTagName("section")[0]?.innerHTML;
        const owner = doc.children[0].getElementsByTagName("owner")[0]?.innerHTML;
        const book = doc.children[0].getElementsByTagName("code")[0]?.innerHTML;
        const page_item = doc.children[0].getElementsByTagName("page_item")[page];

        if (page_item === undefined) {
          return;
        }

        NLog.log(`Target SOBP: ${section}(section) ${owner}(owner) ${book}(book) ${page}(page)`);

        let x1, x2, y1, y2, crop_margin: any, l, t, r, b;

        try {
          x1 = parseInt(page_item.getAttribute("x1")!);
          x2 = parseInt(page_item.getAttribute("x2")!);
          y1 = parseInt(page_item.getAttribute("y1")!);
          y2 = parseInt(page_item.getAttribute("y2")!);

          crop_margin = page_item.getAttribute("crop_margin");
          const margins = crop_margin.split(",");
          l = parseFloat(margins[0]);
          t = parseFloat(margins[1]);
          r = parseFloat(margins[2]);
          b = parseFloat(margins[3]);
        } catch (err) {
          NLog.log(err);
          return;
        }

        const Xmin = point72ToNcode(x1) + point72ToNcode(l);
        const Ymin = point72ToNcode(y1) + point72ToNcode(t);
        const Xmax = point72ToNcode(x2) - point72ToNcode(r);
        const Ymax = point72ToNcode(y2) - point72ToNcode(b);

        resolve({ Xmin, Xmax, Ymin, Ymax });
      };
      xhr.open("GET", url);
      xhr.send();
    });
  });
};

/**
 * GET note image function
 */
const getNoteImage = async (pageInfo: PageInfo, setImageBlobUrl: any) => {
  const sobStr = `/${pageInfo.section}_${pageInfo.owner}_${pageInfo.book}.zip`;
  const page = pageInfo.page;

  const fbApp = initializeApp(firebaseConfig);
  const storage = getStorage(fbApp);

  const jszip = new JSZip();
  await getDownloadURL(ref(storage, `png/${sobStr}`)).then(async (url) => {
    const zipBlob = await fetch(url).then((res) => res.blob());
    await jszip.loadAsync(zipBlob).then(async function (zip) {
      const zipValues: any = await Object.values(zip.files);
      const target = zipValues.filter((x: any) => {
        let found = x.name.match(/(\d+)_(\d+)_(\d+)_(\d+)\.jpg/);
        let pageNum = found[4] * 1;
        if (pageNum === page) {
          return true;
        } else {
          return false;
        }
      });

      await target[0].async("blob").then(async function (imageBlob: any) {
        const imageBlobUrl = await URL.createObjectURL(imageBlob);
        setImageBlobUrl(imageBlobUrl);
      });
    });
  });
};

const api = {
  extractMarginInfo,
  getNoteImage,
  setNprojInPuiController,
};

export default api;
