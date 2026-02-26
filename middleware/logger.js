// middleware/logger.js
// Logs incoming requests and outgoing responses

const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/requests.log');

function logToFile(message) {
    fs.appendFile(logFile, message + '\n', err => {
        if (err) console.error('Failed to write log:', err);
    });
}

const logger = (req, res, next) => {
    const { method, url, headers, body } = req;
    const start = Date.now();
    const reqLog = `REQUEST: ${method} ${url} | Headers: ${JSON.stringify(headers)} | Body: ${JSON.stringify(body)}`;
    logToFile(reqLog);

    const oldSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - start;
        const resLog = `RESPONSE: ${method} ${url} | Status: ${res.statusCode} | Duration: ${duration}ms | Body: ${data}`;
        logToFile(resLog);
        res.send = oldSend;
        return res.send(data);
    };
    next();
};

module.exports = logger;
