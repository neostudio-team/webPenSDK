import zlib from "zlib";

function zlibTest() {
  const input = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

  zlib.deflate(input, (err, buffer) => {
    if (!err) {
      console.log(buffer);
      unzip(buffer);
    } else {
      // handle error
      console.log(err);
    }
  });

  // const buffer = new Uint8Array([120, 156, 99, 100, 98, 102, 97, 101, 99, 231, 224, 100, 0, 0, 0, 220, 0, 46])
}

function unzip(buffer) {
  zlib.unzip(buffer, (err, buffer) => {
    if (!err) {
      console.log(buffer);
    } else {
      // handle error
    }
  });
}

zlibTest()

it("zip test", () => {
  expect(1).toEqual(1);
});
