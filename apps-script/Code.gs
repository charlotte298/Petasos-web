/**
 * Petasos landing page → Google Sheet.
 *
 * Bound to the Sheet (Extensions → Apps Script). Deploy as a web app with
 * "Execute as: Me" and "Who has access: Anyone". See docs/forms-setup.md.
 *
 * The client POSTs JSON with Content-Type text/plain, so the browser sends a
 * CORS simple request with no preflight. Apps Script answers with a 302 to
 * script.googleusercontent.com, and fetch follows it and can read the body.
 */

/** Minimum time between page render and submit. Faster than this is a bot. */
var MIN_FILL_MS = 3000;

/** One tab per form. The columns are appended in this order. */
var TABS = {
  beta: {
    sheet: 'beta',
    fields: ['name', 'email', 'company', 'role', 'files_per_month', 'lines', 'time_sink'],
  },
  sample_letter: {
    sheet: 'sample_letter',
    fields: ['email', 'claim_type', 'loss_state'],
  },
};

/** Columns shared by every tab, after the form fields. */
var META = [
  'page_url',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'distinct_id',
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return reply({ ok: false, error: 'empty_body' });

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return reply({ ok: false, error: 'bad_json' });
    }

    // Spam checks. The endpoint URL is public, so these are the only defense.
    if (data.website) return reply({ ok: false, error: 'rejected' });
    var startedAt = Number(data.startedAt);
    if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) return reply({ ok: false, error: 'too_fast' });

    var tab = TABS[data.form];
    if (!tab) return reply({ ok: false, error: 'unknown_form' });

    var header = ['timestamp'].concat(tab.fields, META);
    var row = [new Date()].concat(
      tab.fields.map(function (f) {
        return cell(data[f]);
      }),
      META.map(function (f) {
        return cell(data[f]);
      })
    );

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = getOrCreateSheet(tab.sheet, header);
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: 'server_error' });
  }
}

/** Lets you open the /exec URL in a browser to check the deployment is live. */
function doGet() {
  return reply({ ok: true, service: 'petasos-forms' });
}

function getOrCreateSheet(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
  }
  return sheet;
}

/** Flattens arrays, trims strings, and stops a leading =, +, - or @ from being read as a formula. */
function cell(value) {
  if (value === undefined || value === null) return '';
  var s = Array.isArray(value) ? value.join(', ') : String(value);
  s = s.trim().slice(0, 1000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
