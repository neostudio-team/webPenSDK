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

export function isPUI(pageInfo: IPageSOBP): boolean {
  const { owner, book, page } = pageInfo;
  if (owner === 27 && book === 161 && page === 1) {
    return true;
  }

  if (owner === 1013 && (book === 1 || book === 1116)) {
    // page === 4, Smart plate
    // page === 1, Plate paper
    return true;
  }

  return false;
}
