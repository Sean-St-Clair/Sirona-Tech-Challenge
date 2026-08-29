// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');

// Enum-like objects for data consistency

const STATUS = Object.freeze({
    PENDING: "PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED"
});

const MODALITY = Object.freeze({
    CT: "CT",
    MRI: "MRI",
    XR: "XR",
    US: "US"
});

// Helper function for generating a unique id
let id = -1;
function generateUID() {
    id++;
    return id;
}

// The patient case class
class Case {

    id;
    patientName;
    modality;
    studyDate;
    status;
    report;
    claimedAt;
    claimedBy;

    constructor(patientName, modality, studyDate, status) {
        this.id = generateUID();
        this.patientName = patientName;
        this.modality = modality;
        this.studyDate = studyDate;
        this.status = status;
        this.report = null;
        this.claimedAt = null;
        this.claimedBy = null;
    }
}

// The employee class
class Employee {

    id;
    username;

    constructor(username) {
        this.id = generateUID();
        this.username = username;
    }
}

// List of patient cases
const cases = [];

// List of employees
const employees = [];

// Populate case list with dummy data
cases.push(new Case("Sean", MODALITY.CT, new Date("2024-11-01"), STATUS.PENDING));
cases.push(new Case("Julien", MODALITY.MRI, new Date("2023-11-01"), STATUS.PENDING));
cases.push(new Case("Lara", MODALITY.XR, new Date("2022-11-01"), STATUS.PENDING));
cases.push(new Case("Mom", MODALITY.US, new Date("2021-11-01"), STATUS.PENDING));
cases.push(new Case("Dad", MODALITY.CT, new Date("2020-11-01"), STATUS.PENDING));
cases.push(new Case("Angelo", MODALITY.MRI, new Date("2010-11-01"), STATUS.PENDING));
cases.push(new Case("John", MODALITY.XR, new Date("2013-11-01"), STATUS.PENDING));
cases.push(new Case("Dmitri", MODALITY.US, new Date("2013-11-01"), STATUS.PENDING));



// App and server init
const app = express();

// Body-parsing middleware
app.use(express.json());

// Sends index.html to client
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
})

// Function returns a list of cases ordered by ascending studyDate
function orderByAscendingStudyDate(cases) {
    // Custom sort function
    return cases.sort((a, b) => {
        return a.studyDate - b.studyDate;
    });
}

function filterByStatus(cases, status) {
    let newCases = [];
    for (patient of cases)
        if (patient.status == status)
            newCases.push(patient);
    return newCases;
}

// TODO: opportunity for code generalization (natural if using database queries)
function filterByClaimedBy(cases, claimedBy) {
    let newCases = [];
    for (patient of cases)
        if (patient.claimedBy == claimedBy)
            newCases.push(patient);
    return newCases;
}

// 1. Lists cases
app.get('/cases', (req, res) => {
    // Returns the query in order
    let queried = orderByAscendingStudyDate(cases);
    // Checks for status query
    if (req.query.status)
        queried = filterByStatus(queried, req.query.status);
    // Checks for claimedBy query
    if (req.query.claimedBy)
        queried = filterByClaimedBy(queried, req.query.claimedBy);
    res.send(queried);
});

// Returns case, if it exists
function findCase(cases, id) {
    let foundCase;
    for (let patient of cases)
        if (patient.id == id)
            foundCase = patient;
    return foundCase;
}

// 2. Gets a single case
app.get('/cases/:id', (req, res) => {
    // Checks that case exists
    let foundCase = findCase(cases, req.params.id);
    if (foundCase)
        res.send(foundCase);
    else
        res.status(404).send(`404 - id "${id}" not found.`);
});

// 3. Manage employees

// GET employees
app.get('/employees', (req, res) => {
    // Send the list of all employees
    res.send(employees);
});

// Function to check if username is valid
function validUsername(employees, username) {
    // Checks that username isn't empty
    if (username == "")
        return false;
    // Checks that username isn't already taken
    for (let employee of employees)
        if (employee.username == username)
            return true;
    return false;
}

// POST employees
app.post('/employees', (req, res) => {
    // Makes sure there is a username in the request
    if (!req.body.username) {
        res.status(404).send("Error: No username provided.");
        return;
    }
    const username = req.body.username;

    // Checks that the username is valid
    if (validUsername(employees, username)) {
        res.status(404).send("Error: Invalid Username.");
    }

    // Otherwise creates new employee
    else {
        const employee = new Employee(username);
        employees.push(employee)
        res.send(employee);
    }
});

// PUT employees/id
app.put('/employees/:id', (req, res) => {
    // TODO: Potential code re-use
    // Makes sure there is a username in the request
    if (!req.body.username) {
        res.status(404).send("Error: No username provided.");
        return;
    }

    // Checks that the username is valid
    let username = req.body.username;
    if (validUsername(employees, username)) {
        res.status(404).send("Error: Invalid Username.");
        return;
    }

    // Checks that employee id exists
    let id = req.params.id;
    let idFound = false;
    for (let employee of employees) {
        if (employee.id == id) {
            // Updates the employee's username
            idFound = true;
            employee.username = req.body.username;
        }
    }

    // Return error if id not found
    if (!idFound) {
        const response = `Employee id "${id}" does not exist.`;
        console.log(response);
        res.status(404).send(response);
    }
});

// DELETE employees/id
app.delete('/employees/:id', (req, res) => {
    // TODO: Opportunity for code re-use
    // Checks that employee id exists
    let id = req.params.id;
    let idFound = false;
    for (let i = 0; i < employees.length; i++) {
        if (employees[i].id == id) {
            // Deletes the employee
            idFound = true;
            res.send(employees[i]);
            employees.splice(i, 1);
        }
    }

    // Return error if id not found
    if (!idFound) {
        const response = `Employee id "${id}" does not exist.`;
        console.log(response);
        res.status(404).send(response);
    }
});

// 4. Claim a Case

function claimCase(foundCase, username) {
    // Change status from "PENDING" to "IN_PROGRESS"
    foundCase.status = STATUS.IN_PROGRESS;

    // Set "claimed by" to the username, and set the time
    foundCase.claimedBy = username;
    foundCase.claimedAt = new Date(Date.now()).toString();
}

app.post('/cases/:id/claim', (req, res) => {
    // Checks that the case exists
    let foundCase = findCase(cases, req.params.id);
    if (!foundCase) {
        res.status(404).send(`Error: Case id "${id}" not found.`);
        return;
    }

    // Checks that the case is in "PENDING" status
    if (foundCase.status != STATUS.PENDING) {
        res.status(404).send(`Error: status is ${foundCase.status}`);
        return;
    }

    // Checks that the username exists and is valid
    if (!req.body.username) {
        res.status(404).send("Error: no username found.");
        return;
    }
    let username = req.body.username;
    if (!validUsername(employees, username)) {
        res.status(404).send(`Error: ${username} is invalid.`);
        return;
    }

    // Finally, claims the case with the appropriate username
    claimCase(foundCase, username);
    // Returns updated case
    const response = foundCase;
    res.send(response);
});

// 5. Submit a report

app.post('/cases/:id/report', (req, res) => {
    // Checks that the case exists
    let foundCase = findCase(cases, req.params.id);
    if (!foundCase) {
        res.status(404).send(`Error: case id "${req.params.id}" is invalid.`);
        return;
    }

    // Checks that the case has an IN_PROGRESS status
    if (foundCase.status != STATUS.IN_PROGRESS) {
        res.status(404).send(`Error: case has status "${foundCase.status}" is invalid.`);
        return;
    }

    // Checks that the report body is present and non-empty
    if (!req.body.report) {
        res.status(404).send(`Error: no report present.`);
        return;
    } else if (req.body.report == "") {
        res.status(404).send(`Error: report is empty.`);
        return;
    }

    // Checks that the username exists and is valid
    if (!req.body.author) {
        res.status(404).send(`Error: no author present.`);
        return;
    } else if (!validUsername(employees, req.body.author)) {
        res.status(404).send(`Error: author name is not valid.`);
        return;
    }

    // Checks that the username matches the employee who claimed the case
    if (req.body.author != foundCase.claimedBy) {
        res.status(404).send(`Error: only the employee who has claimed this case may provide a report.`);
        return;
    }

    // Finally, update the report and send the updated case.
    foundCase.report = req.body.report;
    foundCase.status = STATUS.COMPLETED;
    res.send(foundCase);
});

// Create server
const server = http.createServer(app);

// Host server using environment-given port
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Listening on port ${port}...`));
