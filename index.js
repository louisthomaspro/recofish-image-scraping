const readline = require("readline");
const path = require("path");
const fs = require("fs");
const helper = require("./helper");
const getSpeciesUrlsMap = require("./functions/getSpeciesUrlsMap");
const downloadSpeciesUrlsMap = require("./functions/downloadSpeciesUrlsMap");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Main function
 * @param {string} csvToRead
 * @param {function} fetchUrlsFunc
 * @param {string} downloadDirName
 * @param {number} apiSleepTime
 */
async function main(csvToRead, source, simultaneousImageDownloads = 50) {

  // Read the CSV file and create a map of ID to photos urls (ex: { "1": ["url1", "url2"] })
  const speciesUrlsMap = await getSpeciesUrlsMap(
    csvToRead,
    source === "fishbase"
      ? helper.fetchFishbasePhotosUrls
      : helper.fetchINaturalistPhotosUrls
  );

  // Ask the user if they want to download the photos
  const totalPhotosFound = Object.values(speciesUrlsMap).flat().length;
  const answer = await new Promise((resolve) => {
    rl.question(
      `Download the ${totalPhotosFound} photos found ? (y/n) `,
      resolve
    );
  });
  if (answer.toLowerCase() !== "y") {
    throw "You cancelled the download.";
  }
  rl.close();

  // Download the photos
  const downloadDir = path.join(__dirname, "downloads");
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }
  const downloadDirSource = path.join(downloadDir, `${source}`);
  await downloadSpeciesUrlsMap(
    speciesUrlsMap,
    downloadDirSource,
    source,
    simultaneousImageDownloads
  );

  console.log("Done. Wait for the script to exit.");
}

main(process.argv[2], process.argv[3]);

// main("poissons_premiere_selection.csv", "fishbase");
// main("poissons_premiere_selection.csv", "inaturalist");
