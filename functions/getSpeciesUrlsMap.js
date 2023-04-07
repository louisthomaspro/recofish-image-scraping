const cliProgress = require("cli-progress");
const fs = require("fs");
const csv = require("csv-parser");
const PromisePool = require("es6-promise-pool");

/**
 * Read the CSV file and return a map of ID to photos urls (ex: { "1": ["url1", "url2"] })
 */
async function getSpeciesUrlsMap(
  csvToRead,
  fetchUrlsFunc,
  maxConcurrentRequests
) {
  const csvData = await readCSVFile(csvToRead);

  let speciesUrlsMap = {};
  let notFoundList = [];
  const progressBar = new cliProgress.SingleBar(
    {
      format:
        "[{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total} | ",
    },
    cliProgress.Presets.shades_classic
  );

  // Create a promise pool to limit the number of concurrent requests
  const promiseGenerator = function* () {
    for (const index in csvData) {
      const scientificName = csvData[index].nom_scientifique;
      const ID = csvData[index].ID;
      yield fetchUrlsFunc(scientificName)
        .then((urls) => {
          if (urls == null) {
            notFoundList.push(scientificName);
          } else {
            speciesUrlsMap[ID] = urls;
          }
        })
        .finally(() => {
          progressBar.increment();
        });
    }
  };
  const pool = new PromisePool(promiseGenerator, maxConcurrentRequests);

  // Fetch the photos urls for each species in the CSV file
  console.log(`Fetching photos urls...`);
  progressBar.start(csvData.length, 0);
  await pool.start();
  progressBar.stop();

  // Write the list of species not found to a file
  fs.writeFileSync("species-not-found.txt", notFoundList.join("\r"));

  console.log(
    `Number of species not found: ${notFoundList.length}/${csvData.length}. Check the file "species-not-found.txt`
  );

  return speciesUrlsMap;
}

/**
 * Read a CSV file and return an array of objects with the columns as keys
 */
async function readCSVFile(filePath) {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

module.exports = getSpeciesUrlsMap;
