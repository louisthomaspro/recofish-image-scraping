## How to execute the script

> **Prerequisites** <br>
> NodeJS

1. Clone the repository

```bash
git clone https://github.com/louisthomaspro/recofish-image-scraping.git
```

2. Change directory to the repository

```bash
cd recofish-image-scraping
```

3. Run the script

```bash
node index.js <csv_file> <source (fishbase|inaturalist)> <maxConcurrentApiRequests> <maxConcurrentImageRequests>

# fishbase
node index.js poissons_premiere_selection.csv fishbase 1000 1000
# inaturalist (keep the maxConcurrentApiRequests to 1)
node index.js poissons_premiere_selection.csv inaturalist 1 1000
```

## INaturalist API requests information

We throttle API usage to a max of 100 requests per minute, though we ask that you try to keep it to 60 requests per minute or lower.
