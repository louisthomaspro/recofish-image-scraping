const readline = require("readline");
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
async function main(
  csvToRead,
  source,
  downloadDirName = "downloads",
  tag = "photo",
  apiSleepTime = 0,
  simultaneousImageDownloads = 30
) {
  // Read the CSV file and create a map of ID to photos urls (ex: { "1": ["url1", "url2"] })
  const speciesUrlsMap = await getSpeciesUrlsMap(
    csvToRead,
    source === "fishbase"
      ? helper.fetchFishbasePhotosUrls
      : helper.fetchINaturalistPhotosUrls,
    apiSleepTime
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
  await downloadSpeciesUrlsMap(
    speciesUrlsMap,
    downloadDirName,
    tag,
    simultaneousImageDownloads
  );

  console.log("Done. Wait for the script to exit.");
}

// main(
//   "poissons_premiere_selection.csv",
//   helper.fetchINaturalistPhotosUrls,
//   "downloads-inaturalist",
//   "inaturalist",
//   0,
//   30
// );

main(
  "poissons_premiere_selection.csv",
  helper.fetchFishbasePhotosUrls,
  "downloads-fishbase",
  "fishbase",
  0,
  30
);
