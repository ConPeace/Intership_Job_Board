const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const app = express();

// Use the environment variable PORT or default to 3000
const port = process.env.PORT || 3000;


function sanitizeKey(key) {
  return key.replace(/[^\w\s]/gi, '').trim();
}

function parseISODate(dateString) {
  return new Date(dateString);
}

app.use(express.static('public'));

function isLocationMatch(location, cityQuery) {
    return cityQuery === '' || location.toLowerCase().includes(cityQuery.toLowerCase());
}

app.get('/jobs', (req, res) => {
    let allResults = [];
    const cityQuery = req.query.city || '';
    const jobTypeQuery = req.query.jobType || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const dataDir = path.join(__dirname, 'Data');

    fs.readdir(dataDir, (err, files) => {
        if (err) {
            console.error('Error reading Data directory:', err);
            res.status(500).send('Error reading Data directory');
            return;
        }

        const csvFiles = files.filter(file => file.endsWith('.csv'));
        let filesProcessed = 0;

        csvFiles.forEach(file => {
            const csvFilePath = path.join(dataDir, file);

            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (rawData) => {
                    const sanitizedData = {};
                    Object.keys(rawData).forEach((originalKey) => {
                        const sanitizedKey = sanitizeKey(originalKey);
                        sanitizedData[sanitizedKey] = rawData[originalKey];
                    });

                    if (sanitizedData.postingDateParsed) {
                        sanitizedData.parsedDate = parseISODate(sanitizedData.postingDateParsed);
                    }

                    const cityMatches = isLocationMatch(sanitizedData.location, cityQuery);
                    const jobTypeMatches = jobTypeQuery === '' || sanitizedData.positionName.toLowerCase().includes(jobTypeQuery.toLowerCase());

                    if (cityMatches && jobTypeMatches) {
                        allResults.push(sanitizedData);
                    }
                })
                .on('end', () => {
                    filesProcessed++;
                    if (filesProcessed === csvFiles.length) {
                        allResults.sort((a, b) => b.parsedDate - a.parsedDate);
                        const resultsForPage = allResults.slice(startIndex, startIndex + limit);
                        res.json({
                            results: resultsForPage,
                            nextPage: startIndex + limit < allResults.length ? page + 1 : null,
                            prevPage: page > 1 ? page - 1 : null,
                            totalPositions: allResults.length
                        });
                    }
                });
        });
    });
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
