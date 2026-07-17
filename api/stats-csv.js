import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    const SHEET_ID =
      "1vidR51Lf_mWoC9buSL4g-b6Yq5kgz3R9UxcHR_DQKms";

    const SHEET_NAME = "Sheet1";

    const url =
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(
        SHEET_NAME
      )}&tqx=out:json`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Google Sheets returned ${response.status}`
      );
    }

    const text = await response.text();

    const json = JSON.parse(
      text.substring(47, text.length - 2)
    );

    const rows = json.table.rows;

    const stats = [];

    for (const row of rows) {

      const id =
        row.c?.[0]?.v ?? "";

      const source =
        row.c?.[1]?.v ?? "";

      const message =
        row.c?.[2]?.v ?? "";

      const category =
        row.c?.[3]?.v ?? "";

      if (!id) continue;

      const count =
        Number(
          await redis.get(`count:${id}`)
        ) || 0;

      stats.push({
        id,
        source,
        category,
        message,
        count
      });
    }

    stats.sort(
      (a, b) => b.count - a.count
    );

    let csv =
      "id,source,category,count,message\n";

    for (const item of stats) {

      const cleanMessage =
        String(item.message)
          .replace(/"/g, '""')
          .replace(/\n/g, " ")
          .replace(/\r/g, " ");

      csv +=
        `"${item.id}","${item.source}","${item.category}",${item.count},"${cleanMessage}"\n`;
    }

    res.setHeader(
      "Content-Type",
      "text/csv"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="question_stats.csv"'
    );

    return res.status(200).send(csv);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}
