const XLSX = require('xlsx');
try {
  const workbook = XLSX.readFile('dk_knight_data.xlsx');
  ['Training_Log', 'Attendance'].forEach(sheetName => {
    console.log(`\n--- ${sheetName} Raw Data ---`);
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    rawRows.slice(0, 15).forEach((row, idx) => {
      console.log(`Row ${idx}:`, row);
    });
  });
} catch (e) {
  console.error(e.message);
}
