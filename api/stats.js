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
        count,
        message
      });
    }

    stats.sort(
      (a, b) => b.count - a.count
    );

    const counts = stats.map(
      item => item.count
    );

    return res.status(200).json({
      totalQuestions: stats.length,

      minCount:
        counts.length > 0
          ? Math.min(...counts)
          : 0,

      maxCount:
        counts.length > 0
          ? Math.max(...counts)
          : 0,

      averageCount:
        counts.length > 0
          ? (
              counts.reduce(
                (a, b) => a + b,
                0
              ) / counts.length
            ).toFixed(2)
          : 0,

      handpickedQuestions:
        stats.filter(
          x => x.source === "handpicked"
        ).length,

      systempickedQuestions:
        stats.filter(
          x => x.source === "systempicked"
        ).length,

      stats
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}
