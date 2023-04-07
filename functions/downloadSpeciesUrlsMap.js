const cliProgress = require("cli-progress");
const fs = require("fs");
const path = require("path");
const PromisePool = require("es6-promise-pool");
const helper = require("../helper");

/**
 * Download the photos from the map of ID to photos urls (ex: { "1": ["url1", "url2"] })
 */
async function downloadSpeciesUrlsMap(
  speciesUrlsMap,
  downloadDir,
  source,
  simultaneousDownloads = 20
) {
  // Create the download directory if it doesn't exist
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }

  const progressBar = new cliProgress.SingleBar(
    {
      format:
        "[{bar}] {percentage}% | {value}/{total} | ",
    },
    cliProgress.Presets.shades_classic
  );

  const totalPhotos = Object.values(speciesUrlsMap).flat().length;
  progressBar.start(totalPhotos, 0);

  // Create a generator function that yields a promise for each download
  const promiseGenerator = function* () {
    for (let key in speciesUrlsMap) {
      const images = speciesUrlsMap[key];
      const directoryPath = path.join(downloadDir, key);
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
      }

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const fileName = `${key}_${source}_${Number(i) + 1}.jpg`;
        const imagePath = path.join(directoryPath, fileName);

        // Yield a promise for each download
        yield helper
          .axiosWithProxy(image, {
            responseType: "stream",
          })
          .then((response) => {
            return response.data.pipe(fs.createWriteStream(imagePath));
          })
          .catch((error) => {
            console.error(`Error downloading ${image}`, error.response?.status);
          })
          .finally(() => {
            progressBar.increment();
          });
      }
    }
  };

  // Use PromisePool to limit the number of simultaneous downloads
  const pool = new PromisePool(promiseGenerator, simultaneousDownloads);
  await pool.start();

  progressBar.stop();
}

module.exports = downloadSpeciesUrlsMap;
