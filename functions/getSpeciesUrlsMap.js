const cliProgress = require("cli-progress");
const fs = require("fs");
const helper = require("../helper");
const csv = require("csv-parser");

/**
 * Read the CSV file and return a map of ID to photos urls (ex: { "1": ["url1", "url2"] })
 */
async function getSpeciesUrlsMap(csvToRead, fetchUrlsFunc, apiSleepTime) {
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

  // Fetch the photos urls for each species in the CSV file
  console.log(`Fetching photos urls (debounce time: ${apiSleepTime}ms)...`);
  progressBar.start(csvData.length, 0);
  for (const index in csvData) {
    const scientificName = csvData[index].nom_scientifique;
    const ID = csvData[index].ID;

    try {
      let urls = await fetchUrlsFunc(scientificName);
      await new Promise((resolve) => setTimeout(resolve, apiSleepTime));
      if (urls !== null) speciesUrlsMap[ID] = urls;
    } catch (error) {
      if (error === helper.ERROR_TYPE.NOT_FOUND) {
        notFoundList.push(scientificName);
      } else {
        throw error;
      }
    }
    progressBar.increment();
  }

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
