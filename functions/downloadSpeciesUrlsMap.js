const cliProgress = require("cli-progress");
const fs = require("fs");
const path = require("path");
const helper = require("../helper");

/**
 * Download the photos from the map of ID to photos urls (ex: { "1": ["url1", "url2"] })
 */
async function downloadSpeciesUrlsMap(
  speciesUrlsMap,
  downloadDir,
  source,
  simultaneousDownloads = 200
) {
  // Create the download directory if it doesn't exist
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }

  const progressBar = new cliProgress.SingleBar(
    {
      format:
        "[{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total} | ",
    },
    cliProgress.Presets.shades_classic
  );

  const keys = Object.keys(speciesUrlsMap);
  const totalPhotos = Object.values(speciesUrlsMap).flat().length;
  progressBar.start(totalPhotos, 0);

  const downloadPromises = [];
  for (let i = 0; i < keys.length; i += simultaneousDownloads) {
    const chunk = keys.slice(i, i + simultaneousDownloads);

    const promises = chunk.map(async (key) => {
      const images = speciesUrlsMap[key];

      const directoryPath = path.join(downloadDir, key);
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
      }

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const response = await helper.axiosWithProxy(image, {
          responseType: "stream",
        });
        if (response?.status === 404) {
          console.error(`404 - ${image}`);
        } else if (response?.status === 200) {
          const fileName = `${key}_${source}_${Number(i)+1}.jpg`;
          const imagePath = path.join(directoryPath, fileName);
          response.data.pipe(fs.createWriteStream(imagePath));
        } else {
          console.error(response)
          throw "Unknown error";
        }
        progressBar.increment();
      }
    });

    downloadPromises.push(Promise.all(promises));
  }

  await Promise.all(downloadPromises);

  progressBar.stop();
}

module.exports = downloadSpeciesUrlsMap;
