function formatJobDescription(description) {
    if (!description) return 'Full description not available';

    // Regular expression to match potential section headers
    const sectionRegex = /\b(?:About (?:the Role|Us)|Qualifications|Skills|Competencies|Responsibilities|Requirements|Duties|Eligibility|Experience|Education|Benefits|Location)\b/gi;

    // Remove extra spaces, newlines, and unwanted characters
    description = description.replace(/[\r\n]+/g, '\n').replace(/,+/g, ',').trim();

    // Split the description into sections based on section headers
    let matches;
    let sections = [];
    let lastIndex = 0;
    while ((matches = sectionRegex.exec(description)) !== null) {
        const startIndex = matches.index;
        const endIndex = sectionRegex.lastIndex;

        // Add previous section
        if (startIndex > 0) {
            sections.push(description.substring(lastIndex, startIndex));
        }

        // Update last index
        lastIndex = endIndex;
    }

    // Add the last section
    if (lastIndex < description.length) {
        sections.push(description.substring(lastIndex));
    }

    // Deduplicate and format sections
    let formattedSections = sections.map((section, index) => {
        // Split section into lines and deduplicate
        let lines = section.split('\n');
        let uniqueLines = new Set();
        lines = lines.filter(line => {
            const trimmedLine = line.trim();
            if (uniqueLines.has(trimmedLine) || trimmedLine === '') {
                return false;
            }
            uniqueLines.add(trimmedLine);
            return true;
        });

        // Format lines
        return lines.map((line, lineIndex) => {
            // First line of non-first section is a title
            if (lineIndex === 0 && index > 0) {
                return `<h3>${line.trim()}</h3>`;
            }
            // Other lines
            return line.startsWith('-') ? `<li>${line.substring(1).trim()}</li>` : `<p>${line.trim()}</p>`;
        }).join('');
    });

    return formattedSections.join('');
}

function parsePostedDate(jobElement) {
    const dateSpan = jobElement.querySelector('.job-meta span');
    if (!dateSpan) return null;
    const dateString = dateSpan.textContent.split('Posted: ')[1];
    if (!dateString) return null;
    return new Date(dateString);
}

function sortJobListings(jobElements) {
    return jobElements.sort((a, b) => {
        const dateA = parsePostedDate(a) || new Date(0);
        const dateB = parsePostedDate(b) || new Date(0);
        return dateB - dateA;
    });
}

// Function to create and append job elements
function createJobElements(data) {
    const jobListings = document.getElementById('jobListings');
    jobListings.innerHTML = ''; // Clear any existing content

    if (data.length === 0) {
        const noResultsMessage = document.createElement('p');
        noResultsMessage.textContent = 'No search results found. Please refresh the page.';
        jobListings.appendChild(noResultsMessage);
        return;
    }



    data.forEach((job, index) => {
        const jobElement = document.createElement('div');
        jobElement.classList.add('job-listing');

        const postingDate = job.postingDateParsed 
            ? new Date(job.postingDateParsed).toLocaleDateString("en-US", {
                year: 'numeric', month: 'long', day: 'numeric'
            }) 
            : 'Date not available';

        const jobInfo = document.createElement('div');
        jobInfo.classList.add('job-info');
        jobInfo.innerHTML = `
            <h2>${job.positionName || 'Position name not available'}</h2>
            <p><strong>Company:</strong> ${job.company || 'Company name not available'}</p>
            <p><strong>Location:</strong> ${job.location || 'Location not available'}</p>
            <p><strong>Salary:</strong> ${job.salary || 'Salary not provided'}</p>
            <div class="job-meta">
                <span>Posted: ${postingDate}</span>
                <a href="${job.url || '#'}" target="_blank" class="apply-link">Apply Now</a>
            </div>
        `;

        const jobDescription = document.createElement('div');
        jobDescription.classList.add('job-description');
        const formattedDescription = formatJobDescription(job.description);

        jobDescription.innerHTML = `
            <div id="shortDescription${index}" class="short-description">
                <p>${job.description ? job.description.substring(0, 200) + '...' : 'Description not available'}</p>
                <button class="read-more" id="readMore${index}">Read more</button>
            </div>
            <div id="fullDescription${index}" class="full-description" style="display:none;">
                ${formattedDescription || 'Full description not available'}
            </div>
        `;

        jobElement.appendChild(jobInfo);
        jobElement.appendChild(jobDescription);
        jobListings.appendChild(jobElement);

        // Toggle full description on button click
        document.getElementById(`readMore${index}`).addEventListener('click', () => {
            const fullDesc = document.getElementById(`fullDescription${index}`);
            fullDesc.style.display = fullDesc.style.display === 'none' ? 'block' : 'none';
        });

    });

    
    
}

function fetchAndDisplayJobs(page) {
    const city = document.getElementById('city').value || '';
    const jobType = document.getElementById('jobType').value || '';
    const queryParams = new URLSearchParams({ city, jobType, page, limit: 20 }).toString();

    fetch(`/jobs?${queryParams}`)
        .then(response => response.json())
        .then(data => {
            createJobElements(data.results);
            updatePaginationControls(data.nextPage, data.prevPage, data.totalPositions);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


function updatePaginationControls(nextPage, prevPage, totalPositions) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';

    const totalPositionsDiv = document.createElement('div');
    totalPositionsDiv.textContent = `Total Internship Positions: ${totalPositions}`;
    paginationDiv.appendChild(totalPositionsDiv);

    if (prevPage) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.classList.add('pagination-btn'); // Add this line
        prevButton.onclick = () => fetchAndDisplayJobs(prevPage);
        paginationDiv.appendChild(prevButton);
    }

    if (nextPage) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.classList.add('pagination-btn'); // Add this line
        nextButton.onclick = () => fetchAndDisplayJobs(nextPage);
        paginationDiv.appendChild(nextButton);
    }
}



document.getElementById('searchButton').addEventListener('click', () => {
    fetchAndDisplayJobs(1);
});

// Initial fetch to load the first page of jobs
fetchAndDisplayJobs(1);

// Initial fetch to load the first page of jobs


