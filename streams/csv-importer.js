import fs from "node:fs";
import { parse } from "csv-parse";

const API_URL = "http://localhost:3333/tasks";

class CSVImporter {
  static async import(path) {
    const __dirname = new URL(path, import.meta.url).pathname;
    const parser = fs
      .createReadStream(`${__dirname}`)
      .pipe(parse({ columns: true }));

    for await (const record of parser) {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
    }
  }
}

await CSVImporter.import("./tasks.csv");
