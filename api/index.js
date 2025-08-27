// Vercel serverless function entry point
const express = require('express');
const path = require('path');

// Import the compiled server
const serverPath = path.join(__dirname, '../dist/index.js');
const server = require(serverPath);

module.exports = server;