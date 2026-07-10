
export default async function handler(req, res) {

  const SHEET_ID = "1vidR51Lf_mWoC9buSL4g-b6Yq5kgz3R9UxcHR_DQKms";

  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`;

  const response = await fetch(url);
  const csv = await response.text();

  const rows = csv
    .split("\n")
    .slice(1)
    .map(r => r.split(","));

  const handpicked = [];
  const systempicked = [];

  rows.forEach(row => {

    const id = row[0]?.replaceAll('"', '');
    const source = row[1]?.replaceAll('"', '');
    const message = row.slice(2).join(",").replaceAll('"', '');

    const item = { id, message };

    if (source === "handpicked")
      handpicked.push(item);

    if (source === "systempicked")
      systempicked.push(item);
  });

  shuffle(handpicked);
  shuffle(systempicked);

  const selected = [
    ...handpicked.slice(0, 21),
    ...systempicked.slice(0, 9)
  ];

  shuffle(selected);

  const output = {};

  selected.forEach((item, index) => {

    const n = index + 1;

    output[`ID${n}`] = item.id;
    output[`Q${n}`] = item.message;
  });

  res.status(200).json(output);
}

function shuffle(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] =
      [array[j], array[i]];
  }
}
