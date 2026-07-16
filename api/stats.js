import { Redis } from "@upstash/redis";
import { google } from "googleapis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function getSheetData() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), // ← YOUR SERVICE ACCOUNT JSON
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID, // ← YOUR GOOGLE SHEET ID
    range: "Questions!A:C", // ← YOUR SHEET NAME AND COLUMNS
  });

  const rows = response.data.values || [];

  const lookup = {};

  for (const row of rows.slice(1)) {
    lookup[row[0]] = {
      message: row[1],   // ← COLUMN CONTAINING MESSAGE
      category: row[2],  // ← COLUMN CONTAINING CATEGORY
    };
  }

  return lookup;
}

export default async function handler(req, res) {
  const keys = await redis.keys("count:*");

  const sheetData = await getSheetData();

  const results = [];

  for (const key of keys) {
    const id = key.replace("count:", "");

    results.push({
      id,
      count: await redis.get(key),
      message: sheetData[id]?.message || "",
      category: sheetData[id]?.category || "",
    });
  }

  res.status(200).json(results);
}
