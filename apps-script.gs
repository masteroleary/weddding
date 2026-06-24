// ══════════════════════════════════════════════════════════════
//  Matt & Chelsea Wedding — Google Apps Script Backend
//  Deploy this as a Web App so the wedding site can save RSVPs
//  and song requests to Google Sheets.
//
//  DEPLOY STEPS:
//  1. Go to script.google.com → New project
//  2. Paste this entire file, replacing any starter code
//  3. Click Deploy → New deployment → Web app
//  4. Execute as: Me  |  Who has access: Anyone
//  5. Click Deploy and copy the Web App URL
//  6. Paste that URL into:
//       admin.htm   → const SCRIPT_URL = '...'
//       rsvp.htm    → var WEDDING_SCRIPT_URL = '...'
//       details.htm → var WEDDING_SCRIPT_URL = '...'
// ══════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === 'song') {
      // ── Song Request ────────────────────────────
      let sheet = ss.getSheetByName('Songs');
      if (!sheet) {
        sheet = ss.insertSheet('Songs');
        sheet.appendRow(['Timestamp', 'Artist & Song']);
        sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
      }
      sheet.appendRow([new Date(), data.song]);

    } else {
      // ── RSVP ────────────────────────────────────
      let sheet = ss.getSheetByName('RSVPs');
      if (!sheet) {
        sheet = ss.insertSheet('RSVPs');
        sheet.appendRow(['Timestamp', 'Name', 'Attending', 'Guests', 'Meal', 'Dietary Restrictions', 'Song Request']);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
      }
      sheet.appendRow([
        new Date(),
        data.name       || '',
        data.attending  || '',
        data.guests     || '',
        data.meal       || '',
        data.dietary    || '',
        data.songRequest|| ''
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const type = (e.parameter.type || 'rsvps').toLowerCase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = type === 'songs' ? 'Songs' : 'RSVPs';
    const sheet = ss.getSheetByName(sheetName);
    const data = sheet ? sheet.getDataRange().getValues() : [[]];

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', data: data }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', data: [], message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
