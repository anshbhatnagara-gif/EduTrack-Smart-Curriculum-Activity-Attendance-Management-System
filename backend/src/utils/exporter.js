const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * PDF Exporter using PDFKit
 */
const generatePdf = (title, headers, rows) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffer => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(18).fillColor('#1E293B').text('EduTrack Smart Management System', { align: 'center' });
      doc.fontSize(14).fillColor('#3B82F6').text(title, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#64748B').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Table Headers
      const startX = 40;
      let startY = doc.y;
      const colWidth = (doc.page.width - 80) / headers.length;

      doc.fontSize(10).fillColor('#0F172A').font('Helvetica-Bold');
      headers.forEach((header, index) => {
        doc.text(header, startX + index * colWidth, startY, { width: colWidth, align: 'left' });
      });

      doc.moveTo(startX, startY + 15).lineTo(doc.page.width - 40, startY + 15).strokeColor('#CBD5E1').stroke();
      startY += 20;

      // Table Rows
      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      rows.forEach((row) => {
        if (startY > doc.page.height - 60) {
          doc.addPage();
          startY = 40;
        }

        row.forEach((cell, colIndex) => {
          doc.text(String(cell ?? 'N/A'), startX + colIndex * colWidth, startY, { width: colWidth, align: 'left' });
        });
        startY += 18;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Excel Exporter using ExcelJS
 */
const generateExcel = async (sheetName, headers, rows) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Define Columns
  worksheet.columns = headers.map(header => ({
    header: header,
    key: header.toLowerCase().replace(/\s+/g, '_'),
    width: 22
  }));

  // Add Rows
  rows.forEach(row => {
    const rowObj = {};
    headers.forEach((header, idx) => {
      const key = header.toLowerCase().replace(/\s+/g, '_');
      rowObj[key] = row[idx] ?? 'N/A';
    });
    worksheet.addRow(rowObj);
  });

  // Style Header Row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2563EB' }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  generatePdf,
  generateExcel
};
