const express = require('express');
const cors = require('cors');
const githubRepoRouter = require('./routes/githubRepo.routes');
const reviewRouter = require('./routes/review.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Mount the routers
app.use('/api/repos', githubRepoRouter);
app.use('/api/review', reviewRouter);

// Fallback error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;
