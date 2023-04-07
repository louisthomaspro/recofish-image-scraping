const duckdb = require("duckdb");
const HttpsProxyAgent = require("https-proxy-agent");
const axios = require("axios");
const db = new duckdb.Database(":memory:");

// Get the list of proxies from https://sslproxies.org/
const proxies = [
  "51.159.115.233:3128",
  "54.37.21.230:3128",
  "80.14.219.107:3128",
];

// Rotate the proxies to avoid being blocked by the websites
function getRotatedAgent() {
  const proxyUrl = proxies.shift(); // Take the first proxy and rotate it to the back of the array
  proxies.push(proxyUrl);
  const agent = new HttpsProxyAgent(proxyUrl);
  return agent;
}

async function fetchINaturalistPhotosUrls(scientificName) {
  try {
    const res = await axiosWithProxy(
      `https://api.inaturalist.org/v1/search?sources=taxa&per_page=5&locale=fr&q=${scientificName}`,
      {
        responseType: "json",
      }
    );
    const jsonData = res.data;
    taxaList = jsonData.results.map((r) => r.record);
    taxaList = taxaList.filter(
      (t) => t.rank === "species" && t.is_active === true && t.extinct === false
    );

    if (
      taxaList.length > 0 &&
      taxaList[0].name.toLowerCase() == scientificName.toLowerCase()
    ) {
      photos = taxaList[0].taxon_photos.map((p) => p.photo.original_url);
      return photos;
    } else {
      return null
    }
  } catch (error) {
    console.error(error);
    return null
  }
}

async function fetchFishbasePhotosUrls(scientificName) {
  const query = `SELECT * FROM 'picturesmain.parquet' WHERE LOWER(PicGenus) = LOWER('${
    scientificName.split(" ")[0]
  }') AND LOWER(PicSpecies) = LOWER('${scientificName.split(" ")[1]}')`;

  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) {
        console.error(err);
        reject(null);
      } else {
        if (rows.length > 0) {
          photos = rows.map(
            (r) => `https://www.fishbase.se/images/species/${r.PicName}`
          );
          resolve(photos);
        } else {
          reject(null);
        }
      }
    });
  });
}

/**
 * Fetch a URL with a proxy, retrying if it fails
 */
async function axiosWithProxy(url, options) {
  return await axios({
    method: "get",
    url,
    httpAgent: getRotatedAgent(), // assuming getRotatedAgent() returns an http.Agent object
    ...options,
  });
}

module.exports = {
  fetchFishbasePhotosUrls,
  fetchINaturalistPhotosUrls,
  axiosWithProxy,
};
