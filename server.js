const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const app = express();
const port = 3000;

function sanitizeKey(key) {
  return key.replace(/[^\w\s]/gi, '').trim();
}

function hasMatchingLetters(str1, str2, count) {
  const letters1 = new Set(str1.toLowerCase().split(''));
  const matchingLetters = [...str2.toLowerCase()].filter(letter => letters1.has(letter));
  return new Set(matchingLetters).size >= count;
}

app.use(express.static('public'));

app.get('/jobs', (req, res) => {
    const results = [];
    const cityQuery = req.query.city || '';
    const jobTypeQuery = req.query.jobType || '';

    const dataDir = '/Users/connorpettepiece/Desktop/Website/Data';

    // Read all files in the Data directory
    fs.readdir(dataDir, (err, files) => {
        if (err) {
            console.error('Error reading Data directory:', err);
            return res.status(500).send('Error reading Data directory');
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

                    const cityMatches = cityQuery === '' || hasMatchingLetters(sanitizedData.location, cityQuery, 3);
                    const jobTypeMatches = jobTypeQuery === '' || sanitizedData.positionName.toLowerCase().includes(jobTypeQuery.toLowerCase());

                    if (cityMatches && jobTypeMatches) {
                        results.push(sanitizedData);
                    }
                })
                .on('end', () => {
                    filesProcessed++;
                    if (filesProcessed === csvFiles.length) {
                        console.log(`Finished processing all files. Jobs Found: ${results.length}`);
                        res.json(results);
                    }
                });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
