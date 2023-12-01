type IPageSOBP = {
  section: number;
  book: number;
  owner: number;
  page: number;
};

export default class PageInfo {
  section: number;
  owner: number;
  book: number;
  page: number;
  constructor(s: number, o: number, b: number, p: number) {
    this.section = s;
    this.owner = o;
    this.book = b;
    this.page = p;
  }
}
