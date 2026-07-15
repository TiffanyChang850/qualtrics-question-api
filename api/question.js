import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    const SHEET_ID = "1vidR51Lf_mWoC9buSL4g-b6Yq5kgz3R9UxcHR_DQKms";
    const SHEET_NAME = "Sheet1";

    const url =
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&tqx=out:json`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}`);
    }

    const text = await response.text();

    const json = JSON.parse(
      text.substring(47, text.length - 2)
    );

    const rows = json.table.rows;

    const handpicked = [];
    const systempicked = [];

    for (const row of rows) {

      const id = row.c?.[0]?.v ?? "";
      const source = String(
        row.c?.[1]?.v ?? ""
      ).trim().toLowerCase();
      const message = row.c?.[2]?.v ?? "";

      if (!id || !message) continue;

      const item = {
        id,
        message,
        count: 0
      };

      if (source === "handpicked") {
        handpicked.push(item);
      }

      if (source === "systempicked") {
        systempicked.push(item);
      }
    }

    if (handpicked.length < 9) {
      throw new Error(
        `Need 9 handpicked items but found ${handpicked.length}`
      );
    }

    if (systempicked.length < 21) {
      throw new Error(
        `Need 21 systempicked items but found ${systempicked.length}`
      );
    }

    shuffle(handpicked);
    shuffle(systempicked);

    const handCandidates =
      handpicked.slice(0, Math.min(50, handpicked.length));

    const systemCandidates =
      systempicked.slice(0, Math.min(50, systempicked.length));

    for (const item of handCandidates) {
      item.count =
        Number(await redis.get(`count:${item.id}`)) || 0;
    }

    for (const item of systemCandidates) {
      item.count =
        Number(await redis.get(`count:${item.id}`)) || 0;
    }

    handCandidates.sort(
      (a, b) => a.count - b.count
    );

    systemCandidates.sort(
      (a, b) => a.count - b.count
    );

    const selected = [
      ...handCandidates.slice(0, 9),
      ...systemCandidates.slice(0, 21)
    ];

    shuffle(selected);

    await Promise.all(
      selected.map(item =>
        redis.incr(`count:${item.id}`)
      )
    );

    const output = {};

    selected.forEach((item, index) => {

      const n = index + 1;

      output[`ID${n}`] = item.id;
      output[`Q${n}`] = item.message;
    });

    output.totalReturned = selected.length;

    return res.status(200).json(output);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}

function shuffle(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [array[i], array[j]] =
      [array[j], array[i]];
  }
}
