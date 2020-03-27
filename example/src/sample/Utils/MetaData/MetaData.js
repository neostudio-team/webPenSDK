let base = 'https://neonotes2-d0880.firebaseio.com/'

//{height, width, x, y}
export function getNoteSize(page) {
  let s = page.section
  let o = page.owner
  let n = page.note
  let p = page.page

  let url = 'page/' + s + '/' + o + '/' + n + + "/" + p + '.json?'
  let defaultPage = 'page/' + s + '/' + o + '/' + n + '/0.json?'
  let defaultRect = {
      height:118,
      width: 91,
      x: 5,
      y: 5
  }
  return new Promise((resove, reject) => {
    fetch(base + url)
    .then(res => res.json())
    .then(json => {
      if (!json){
        return fetch(base+defaultPage)
      } 
      resove(json)
      // console.log(json)
    })
    .then(res => res.json())
    .then(json => {
      if (!json) {
        resove(defaultRect)
      }
      resove(json)
      // console.log(json)
    })
    .catch (error => {
      console.log("error", error)
      resove(defaultRect)
    })
  })
}

/**
* Returns notemeta Info
* @param {object} note section, owner, note
* @returns {Promise} thumbnail, title, updated, zipfile, totalcount
*/
export function getNoteInfo(note) {
  let s = note.section
  let o = note.owner
  let n = note.note
  
  let url = 'note/' + s + '/' + o + '/' + n + '.json?'
  return new Promise((resove, reject) => {
    fetch(base + url)
    .then(res => res.json())
    .then(json => {
      resove(json)
      // console.log(json)
    })
    .catch (error => {
      console.error("getNoteInfo error user Dummy ", error)
      let dummy = {
        "pagecount" : 1,
        "thumbnail" : "../../assets/cover/default.png",
        "title" : "UnKnown",
        "totalcount" : "1",
        "updated" : 1523866339,
      }
      resove(dummy)
    })
  })
}

