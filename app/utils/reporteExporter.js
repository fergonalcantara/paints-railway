const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * Generar PDF de reporte
 */
exports.generarPDF = async (titulo, datos, columnas, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'letter' });
    
    // Headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${titulo}.pdf"`);
    
    doc.pipe(res);
    
    // Título
    doc.fontSize(18).text(titulo, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-GT')}`, { align: 'center' });
    doc.moveDown(2);
    
    // Tabla
    const startY = doc.y;
    const columnWidth = 500 / columnas.length;
    
    // Headers de tabla
    doc.fontSize(10).fillColor('#333');
    columnas.forEach((col, index) => {
        doc.text(col.header, 50 + (index * columnWidth), startY, {
            width: columnWidth,
            align: 'left',
            bold: true
        });
    });
    
    doc.moveDown();
    doc.strokeColor('#cccccc').lineWidth(1)
       .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    // Datos
    datos.forEach((fila, rowIndex) => {
        const y = doc.y;
        
        // Verificar si necesitamos nueva página
        if (y > 700) {
            doc.addPage();
            doc.y = 50;
        }
        
        columnas.forEach((col, colIndex) => {
            const valor = fila[col.field] || '-';
            doc.fontSize(9).fillColor('#000')
               .text(valor.toString(), 50 + (colIndex * columnWidth), doc.y, {
                   width: columnWidth,
                   align: 'left'
               });
        });
        
        doc.moveDown(0.8);
    });
    
    // Pie de página
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#666')
       .text(`Total de registros: ${datos.length}`, 50, doc.y, { align: 'center' });
    
    doc.end();
};

/**
 * Generar Excel de reporte
 */
exports.generarExcel = async (titulo, datos, columnas, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(titulo);
    
    // Configurar columnas
    worksheet.columns = columnas.map(col => ({
        header: col.header,
        key: col.field,
        width: col.width || 20
    }));
    
    // Estilo del header
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Agregar datos
    datos.forEach(fila => {
        worksheet.addRow(fila);
    });
    
    // Autofit columns
    worksheet.columns.forEach(column => {
        let maxLength = column.header.length;
        column.eachCell({ includeEmpty: true }, cell => {
            const cellValue = cell.value ? cell.value.toString() : '';
            maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(maxLength + 2, 50);
    });
    
    // Headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${titulo}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
};