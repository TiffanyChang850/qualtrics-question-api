export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/html");

  res.send(`
    <html>
      <body>
        <h1>Question Stats</h1>

        <p>
          <a href="/api/stats-csv">
            Download Latest CSV
          </a>
        </p>

        <p>
          <a href="/api/stats">
            View Raw JSON
          </a>
        </p>
      </body>
    </html>
  `);
}
