
// This file allows us to test different cases.

// Async function to help print errors / responses
async function printResponse(response) {
    result = await response;
    console.log(result)
}

// Tests all of the given cases.
async function test() {
    const url = "http://localhost:3000/";

    // Setup: let's add an employee, John Smith.
    let response, result;
    response = await fetch("http://localhost:3000/employees", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ username: "john smith" })
    });
    printResponse(response);

    // 1. Claiming a PENDING case succeeds and transitions its status.
    response = await fetch("http://localhost:3000/cases/5/claim", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ username: "john smith" })
    });
    printResponse(response);

    // 2. Claiming a case that is already IN_PROGRESS or COMPLETED returns an error.
    response = await fetch("http://localhost:3000/cases/5/claim", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ username: "john smith" })
    });
    printResponse(response);

    // 3. Claiming a case with a missing or unknown username returns an error.
    response = await fetch("http://localhost:3000/cases/5/claim", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({})
    });
    printResponse(response);

    // 4. Submitting a report on an IN_PROGRESS case succeeds.
    response = await fetch("http://localhost:3000/cases/5/report", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ author: "john smith", report: "Findings are consistent with..." })
    });
    printResponse(response);

    // 5. Submitting a report on a PENDING or COMPLETED case returns an error.

    // Completed
    response = await fetch("http://localhost:3000/cases/5/report", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ author: "john smith", report: "Findings are consistent with..." })
    });
    printResponse(response);

    // Pending
    response = await fetch("http://localhost:3000/cases/0/report", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ author: "john smith", report: "Findings are consistent with..." })
    });
    printResponse(response);

    // 6. Submitting a report with an empty body returns a validation error.

    // (Let's claim it, first)
    response = await fetch("http://localhost:3000/cases/0/claim", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ username: "john smith" })
    });
    printResponse(response);

    response = await fetch("http://localhost:3000/cases/0/report", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ author: "john smith", report: "" })
    });
    printResponse(response);

    // 7. Submitting a report as an employee other than the one who claimed the case returns an error.

    // (Again, let's claim a new one)
    response = await fetch("http://localhost:3000/cases/2/claim", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ username: "john smith" })
    });
    printResponse(response);

    response = await fetch("http://localhost:3000/cases/2/report", {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ author: "tim burton", report: "This is a valid report! Just wrong author." })
    });
    printResponse(response);
}
test();
