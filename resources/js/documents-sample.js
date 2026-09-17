/* 시연용 샘플 서류 생성기.
   업체가 실제로 올린 파일이 없는 시연 데이터에서도 파일명을 누르면 파일이 받아지도록,
   서류 원장(MASTER)에 적힌 확장자에 맞는 "열리는" 파일을 그 자리에서 만든다.
     .csv → UTF-8 BOM CSV
     .jpg → canvas로 그린 JPEG
     .pdf → 위 JPEG 한 장을 넣은 1페이지 PDF
   내용은 서류명·업체명·제출일과 원장의 작성 안내뿐이며 개인정보는 넣지 않는다. */
(function () {
  'use strict';

  var PAGE_W = 900, PAGE_H = 1273;   // A4 비율(595:842)에 맞춘 캔버스 크기
  var PDF_W = 595, PDF_H = 842;      // PDF MediaBox (pt)

  function extensionOf(name) {
    var match = /\.([a-z0-9]+)$/i.exec(String(name || ''));
    return match ? match[1].toLowerCase() : 'csv';
  }

  function wrap(context, text, width) {
    var lines = [], line = '';
    String(text).split('').forEach(function (char) {
      var next = line + char;
      if (context.measureText(next).width > width && line) { lines.push(line); line = char; }
      else line = next;
    });
    if (line) lines.push(line);
    return lines;
  }

  function paint(doc, vendorName, dateText) {
    var canvas = document.createElement('canvas');
    canvas.width = PAGE_W; canvas.height = PAGE_H;
    var c = canvas.getContext('2d');
    var font = function (size, weight) { return (weight || 400) + ' ' + size + 'px "Noto Sans KR", "Malgun Gothic", sans-serif'; };

    c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, PAGE_W, PAGE_H);
    c.strokeStyle = '#D5DAE1'; c.lineWidth = 2; c.strokeRect(40, 40, PAGE_W - 80, PAGE_H - 80);

    c.fillStyle = '#7A828D'; c.font = font(20, 600);
    c.fillText('PreCheck · 시연용 샘플 서류', 76, 108);

    c.fillStyle = '#16202B'; c.font = font(38, 700);
    wrap(c, doc.name, PAGE_W - 160).forEach(function (line, index) { c.fillText(line, 76, 168 + index * 50); });

    var y = 300;
    c.font = font(20, 400); c.fillStyle = '#4B5561';
    [['업체명', vendorName], ['제출일', dateText], ['서류 구분', doc.kind + ' 서류']].forEach(function (pair) {
      c.fillStyle = '#7A828D'; c.fillText(pair[0], 76, y);
      c.fillStyle = '#16202B'; c.fillText(String(pair[1] || '-'), 230, y);
      y += 42;
    });

    y += 18;
    c.strokeStyle = '#E4E8ED'; c.beginPath(); c.moveTo(76, y); c.lineTo(PAGE_W - 76, y); c.stroke();
    y += 52;

    c.fillStyle = '#16202B'; c.font = font(24, 700);
    c.fillText('작성 안내', 76, y); y += 46;

    c.font = font(20, 400);
    (doc.how || []).forEach(function (step, index) {
      c.fillStyle = '#7A828D'; c.fillText(String(index + 1) + '.', 76, y);
      c.fillStyle = '#374150';
      wrap(c, step, PAGE_W - 220).forEach(function (line) { c.fillText(line, 118, y); y += 34; });
      y += 10;
    });

    c.fillStyle = '#9AA2AC'; c.font = font(18, 400);
    c.fillText('이 파일은 화면 시연을 위해 만들어진 샘플입니다.', 76, PAGE_H - 116);
    c.fillText('실제 제출 서류가 아니며, 개인정보가 들어 있지 않습니다.', 76, PAGE_H - 84);
    return canvas;
  }

  function jpegBytes(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) { reject(new Error('이미지를 만들 수 없습니다.')); return; }
        blob.arrayBuffer().then(function (buffer) { resolve(new Uint8Array(buffer)); }, reject);
      }, 'image/jpeg', 0.9);
    });
  }

  /* DCTDecode 이미지 한 장짜리 최소 PDF. 바이트 오프셋을 직접 세어 xref를 만든다. */
  function buildPdf(jpeg) {
    var encoder = new TextEncoder(), parts = [], offsets = [], length = 0;
    function push(chunk) {
      var bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
      parts.push(bytes); length += bytes.length;
    }
    var content = 'q ' + PDF_W + ' 0 0 ' + PDF_H + ' 0 0 cm /Im0 Do Q\n';
    push('%PDF-1.4\n');
    offsets[1] = length; push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    offsets[2] = length; push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    offsets[3] = length; push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PDF_W + ' ' + PDF_H +
      '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
    offsets[4] = length; push('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + PAGE_W + ' /Height ' + PAGE_H +
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n');
    push(jpeg); push('\nendstream\nendobj\n');
    offsets[5] = length; push('5 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream\nendobj\n');
    var xref = length, table = 'xref\n0 6\n0000000000 65535 f \n';
    for (var index = 1; index <= 5; index++) table += ('0000000000' + offsets[index]).slice(-10) + ' 00000 n \n';
    push(table);
    push('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');

    var out = new Uint8Array(length), at = 0;
    parts.forEach(function (bytes) { out.set(bytes, at); at += bytes.length; });
    return out;
  }

  function csvBlob(doc, vendorName, dateText) {
    var rows = [['항목', '내용'], ['서류명', doc.name], ['업체명', vendorName], ['제출일', dateText], ['서류 구분', doc.kind + ' 서류']];
    (doc.how || []).forEach(function (step, index) { rows.push([(index + 1) + '단계', step]); });
    rows.push(['비고', '화면 시연용 샘플입니다. 실제 제출 서류가 아닙니다.']);
    var csv = '﻿' + rows.map(function (row) {
      return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\r\n') + '\r\n';
    return new Blob([csv], { type: 'text/csv;charset=utf-8' });
  }

  /* doc: MASTER 항목 / vendorName: 업체명 / dateText: 사람이 읽는 제출일 */
  function make(doc, vendorName, dateText) {
    var name = doc.file || (doc.name + '.csv');
    var kind = extensionOf(name);
    if (kind === 'csv' || kind === 'txt') return Promise.resolve({ blob: csvBlob(doc, vendorName, dateText), name: name });

    var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    return ready.catch(function () {}).then(function () {
      var canvas = paint(doc, vendorName, dateText);
      return jpegBytes(canvas).then(function (jpeg) {
        if (kind === 'pdf') return { blob: new Blob([buildPdf(jpeg)], { type: 'application/pdf' }), name: name };
        if (kind === 'png') return { blob: new Blob([jpeg], { type: 'image/jpeg' }), name: name.replace(/\.png$/i, '.jpg') };
        return { blob: new Blob([jpeg], { type: 'image/jpeg' }), name: name };
      });
    }).catch(function () {
      return { blob: csvBlob(doc, vendorName, dateText), name: name.replace(/\.[a-z0-9]+$/i, '') + '.csv' };
    });
  }

  window.DocumentSample = { make: make };
})();
