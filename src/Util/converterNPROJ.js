const xml2js = require("xml2js");
const fs = require("fs");

const dir = "./src/API/nproj";
fs.readdir(dir, (err, files) => {
  if (err) {
    throw err;
  }
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i].split(".")[0];
    const xml = fs.readFileSync(`./src/API/nproj/${fileName}.nproj`);

    xml2js.parseString(xml, (err, result) => {
      if (err) {
        throw err;
      }
      const json = JSON.stringify(result, null, 2);

      fs.writeFileSync(`./src/API/nproj/${fileName}.json`, json);
    });
  }
});
