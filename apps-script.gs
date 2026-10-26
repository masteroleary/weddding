// ══════════════════════════════════════════════════════════════
//  Matt & Chelsea Wedding — Google Apps Script Backend
//  Saves RSVPs and song requests from the wedding site into a
//  Google Sheet, and hands them back to admin.htm.
//
//  TO UPDATE THE LIVE SCRIPT:
//  1. Go to script.google.com and open the wedding project
//  2. Select all the old code and paste this file over it
//  3. Save (the disk icon)
//  4. Deploy → Manage deployments → the pencil icon →
//     Version: "New version" → Deploy
//  5. Approve the permissions prompt if one appears
//
//  Step 4 keeps the SAME web app URL, so nothing in the website
//  needs changing.
//
//  The script finds its own spreadsheet: if this project is bound
//  to one it uses that, otherwise it creates "Wedding RSVPs" in
//  the owner's Google Drive the first time it runs and remembers
//  it from then on. Nothing to paste, no IDs to look up.
// ══════════════════════════════════════════════════════════════

var SHEET_NAME_PROP = 'SHEET_ID';
var SPREADSHEET_TITLE = 'Wedding RSVPs';

// The previous version called SpreadsheetApp.getActiveSpreadsheet()
// directly. That returns null in a standalone script — one created at
// script.google.com rather than from inside a sheet — so every read and
// every save failed with "Cannot read properties of null".
function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(SHEET_NAME_PROP);

  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (err) {
      // Remembered sheet was deleted or lost; fall through and make a new one.
      props.deleteProperty(SHEET_NAME_PROP);
    }
  }

  // If this project IS bound to a spreadsheet, keep using it so any
  // responses already collected there stay with the rest.
  var bound = SpreadsheetApp.getActiveSpreadsheet();
  if (bound) {
    props.setProperty(SHEET_NAME_PROP, bound.getId());
    return bound;
  }

  // Lock so two RSVPs landing at once cannot create two spreadsheets.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    id = props.getProperty(SHEET_NAME_PROP);
    if (id) return SpreadsheetApp.openById(id);
    var made = SpreadsheetApp.create(SPREADSHEET_TITLE);
    props.setProperty(SHEET_NAME_PROP, made.getId());
    return made;
  } finally {
    lock.releaseLock();
  }
}

function getSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = getSpreadsheet_();

    if (data.type === 'song') {
      // ── Song Request ────────────────────────────
      var songs = getSheet_(ss, 'Songs', ['Timestamp', 'Artist & Song']);
      songs.appendRow([new Date(), data.song || '']);

    } else {
      // ── RSVP ────────────────────────────────────
      var rsvps = getSheet_(ss, 'RSVPs', [
        'Timestamp', 'Name', 'Attending', 'Guests',
        'Meal', 'Dietary Restrictions', 'Song Request'
      ]);
      rsvps.appendRow([
        new Date(),
        data.name        || '',
        data.attending   || '',
        data.guests      || '',
        data.meal        || '',
        data.dietary     || '',
        data.songRequest || ''
      ]);
    }

    return json_({ status: 'ok' });

  } catch (err) {
    return json_({ status: 'error', message: err.message });
  }
}

function doGet(e) {
  try {
    var type = ((e && e.parameter && e.parameter.type) || 'rsvps').toLowerCase();
    var ss = getSpreadsheet_();

    // ?type=link just reports where the responses are being kept.
    if (type === 'link') {
      return json_({ status: 'ok', sheetUrl: ss.getUrl(), title: ss.getName() });
    }

    var sheet = ss.getSheetByName(type === 'songs' ? 'Songs' : 'RSVPs');
    var data = sheet ? sheet.getDataRange().getValues() : [[]];

    return json_({ status: 'ok', data: data, sheetUrl: ss.getUrl() });

  } catch (err) {
    return json_({ status: 'error', data: [], message: err.message });
  }
}
