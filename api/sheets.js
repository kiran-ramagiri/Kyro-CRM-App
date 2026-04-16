const { google } = require('googleapis');

// ---------------------------------------------------------------------------
// Sheet column definitions (order matters — these become the row values)
// ---------------------------------------------------------------------------
const SHEET_HEADERS = {
  Accounts: [
    'id', 'name', 'type', 'assigned_to', 'platforms', 'retainer_scope',
    'ig_handle', 'login_user', 'login_pass', 'notes',
    'content_calendar_url', 'created_at', 'updated_at',
  ],
  Content: [
    'id', 'account_id', 'title', 'platform', 'type', 'status',
    'due_date', 'published_date', 'notes', 'updated_at',
  ],
  Payments: [
    'id', 'account_id', 'amount', 'currency', 'invoice_date', 'due_date',
    'paid', 'paid_date', 'recurring', 'recurrence_period', 'assigned_to', 'notes',
  ],
};

const BOOL_FIELDS = new Set(['paid', 'recurring']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function columnLetter(n) {
  let letter = '';
  while (n > 0) {
    const mod = (n - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY env var is not set');
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    const raw = row[i] !== undefined ? row[i] : '';
    if (BOOL_FIELDS.has(h)) {
      obj[h] = raw === 'TRUE' || raw === 'true' || raw === '1' || raw === true;
    } else {
      obj[h] = raw;
    }
  });
  return obj;
}

function objectToRow(headers, data, existingRow = []) {
  return headers.map((h, i) => {
    if (data[h] !== undefined) {
      const v = data[h];
      if (BOOL_FIELDS.has(h)) return v ? 'TRUE' : 'FALSE';
      return v === null ? '' : String(v);
    }
    return existingRow[i] !== undefined ? existingRow[i] : '';
  });
}

async function ensureSheetTab(sheetsClient, spreadsheetId, sheetName) {
  let needsHeaders = false;
  try {
    const check = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:A1`,
    });
    // Tab exists but is empty (user created it manually with no headers)
    if (!check.data.values || check.data.values.length === 0) {
      needsHeaders = true;
    }
  } catch (err) {
    // Tab doesn't exist — create it
    try {
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
    } catch (_) {
      // May already exist, ignore
    }
    needsHeaders = true;
  }

  if (needsHeaders) {
    const headers = SHEET_HEADERS[sheetName];
    if (headers) {
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // -----------------------------------------------------------------------
    // GET  /api/sheets?sheet=Accounts
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      const { sheet } = req.query;
      if (!SHEET_HEADERS[sheet]) {
        return res.status(400).json({ error: `Unknown sheet: ${sheet}` });
      }

      await ensureSheetTab(sheets, spreadsheetId, sheet);

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheet}!A:${columnLetter(SHEET_HEADERS[sheet].length)}`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return res.json([]);

      const headers = rows[0];
      const data = rows.slice(1)
        .filter(row => row.some(cell => cell !== ''))
        .map(row => rowToObject(headers, row));

      return res.json(data);
    }

    // -----------------------------------------------------------------------
    // POST /api/sheets  { action, sheet, data, id }
    // -----------------------------------------------------------------------
    if (req.method === 'POST') {
      const { action, sheet, data, id } = req.body || {};

      if (!SHEET_HEADERS[sheet]) {
        return res.status(400).json({ error: `Unknown sheet: ${sheet}` });
      }

      // --- APPEND (insert new row) ------------------------------------------
      if (action === 'append') {
        await ensureSheetTab(sheets, spreadsheetId, sheet);
        const headers = SHEET_HEADERS[sheet];
        const row = objectToRow(headers, data);

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheet}!A:A`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [row] },
        });

        return res.json({ success: true });
      }

      // --- UPDATE (overwrite row by id) -------------------------------------
      if (action === 'update') {
        const allData = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheet}!A:${columnLetter(SHEET_HEADERS[sheet].length)}`,
        });

        const rows = allData.data.values || [];
        if (rows.length === 0) return res.status(404).json({ error: 'Sheet is empty' });

        const headers = rows[0];
        const idIdx = headers.indexOf('id');
        const rowIndex = rows.findIndex((r, i) => i > 0 && r[idIdx] === id);

        if (rowIndex === -1) return res.status(404).json({ error: 'Row not found' });

        // Auto-set updated_at
        const mergedData = { ...data, updated_at: new Date().toISOString().split('T')[0] };
        const updatedRow = objectToRow(headers, mergedData, rows[rowIndex]);
        const endCol = columnLetter(headers.length);
        const range = `${sheet}!A${rowIndex + 1}:${endCol}${rowIndex + 1}`;

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [updatedRow] },
        });

        return res.json({ success: true });
      }

      // --- DELETE (remove row by id) ----------------------------------------
      if (action === 'delete') {
        // Get all spreadsheet metadata to find the sheetId integer
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetMeta = meta.data.sheets.find(s => s.properties.title === sheet);
        if (!sheetMeta) return res.status(404).json({ error: 'Sheet tab not found' });
        const sheetId = sheetMeta.properties.sheetId;

        const allData = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheet}!A:A`,
        });

        const rows = allData.data.values || [];
        const idIdx = 0; // 'id' is always column A
        const rowIndex = rows.findIndex((r, i) => i > 0 && r[idIdx] === id);

        if (rowIndex === -1) return res.status(404).json({ error: 'Row not found' });

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            }],
          },
        });

        return res.json({ success: true });
      }

      return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[sheets api error]', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
