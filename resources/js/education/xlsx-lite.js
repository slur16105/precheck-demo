(function (root) {
  "use strict";

  const decoder = new TextDecoder("utf-8");

  function findEndOfCentralDirectory(view) {
    const start = Math.max(0, view.byteLength - 65557);
    for (let offset = view.byteLength - 22; offset >= start; offset -= 1) {
      if (view.getUint32(offset, true) === 0x06054b50) return offset;
    }
    throw new Error("Excel 파일 구조를 확인할 수 없습니다.");
  }

  async function inflateRaw(bytes) {
    if (!("DecompressionStream" in root)) {
      throw new Error("이 브라우저에서는 Excel 압축 해제를 지원하지 않습니다.");
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzip(buffer) {
    const view = new DataView(buffer);
    const end = findEndOfCentralDirectory(view);
    const count = view.getUint16(end + 10, true);
    let offset = view.getUint32(end + 16, true);
    const files = new Map();

    for (let index = 0; index < count; index += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) {
        throw new Error("Excel 압축 항목을 읽을 수 없습니다.");
      }
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = decoder.decode(new Uint8Array(buffer, offset + 46, nameLength));
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = new Uint8Array(buffer, dataStart, compressedSize);

      if (method === 0) files.set(name, compressed);
      else if (method === 8) files.set(name, await inflateRaw(compressed));
      else throw new Error("지원하지 않는 Excel 압축 방식입니다.");

      offset += 46 + nameLength + extraLength + commentLength;
    }
    return files;
  }

  function parseXml(bytes) {
    if (!bytes) return null;
    const doc = new DOMParser().parseFromString(decoder.decode(bytes), "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("Excel XML을 읽을 수 없습니다.");
    return doc;
  }

  function columnIndex(reference) {
    const letters = (reference.match(/[A-Z]+/i) || ["A"])[0].toUpperCase();
    let result = 0;
    for (const letter of letters) result = result * 26 + letter.charCodeAt(0) - 64;
    return result - 1;
  }

  async function read(file) {
    if (!file || !/\.xlsx$/i.test(file.name || "")) {
      throw new Error(".xlsx 형식의 Excel 파일을 선택해주세요.");
    }
    const files = await unzip(await file.arrayBuffer());
    const sharedStrings = parseXml(files.get("xl/sharedStrings.xml"));
    const strings = sharedStrings
      ? [...sharedStrings.querySelectorAll("si")].map((item) =>
          [...item.querySelectorAll("t")].map((node) => node.textContent || "").join("")
        )
      : [];
    const sheet = parseXml(files.get("xl/worksheets/sheet1.xml"));
    if (!sheet) throw new Error("첫 번째 Excel 시트를 찾을 수 없습니다.");

    const rows = [];
    for (const row of sheet.querySelectorAll("sheetData > row")) {
      const values = [];
      for (const cell of row.querySelectorAll(":scope > c")) {
        const index = columnIndex(cell.getAttribute("r") || "A1");
        const type = cell.getAttribute("t");
        let value = "";
        if (type === "inlineStr") {
          value = [...cell.querySelectorAll("is t")].map((node) => node.textContent || "").join("");
        } else {
          const raw = cell.querySelector("v")?.textContent || "";
          value = type === "s" ? strings[Number(raw)] || "" : raw;
        }
        values[index] = value;
      }
      rows.push(values.map((value) => String(value ?? "").trim()));
    }
    return rows;
  }

  root.XlsxLite = { read };
})(window);
