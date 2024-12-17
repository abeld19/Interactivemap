const express = require('express');
const app = express();
const port = 3000;

// Sample data
const points = [
    { coords: [200, 300], title: "Oak Tree", url: "/oak", image: "images/oak.png" },
    { coords: [1173.75, 544], title: "Pond", url: "/pond", image: "images/pond.png" },
    { coords: [1965.75, 2128], title: "Mushroom Grove" }
];

// Serve static files
app.use(express.static('public'));

// API endpoint to get points data
app.get('/api/points', (req, res) => {
    res.json(points);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
