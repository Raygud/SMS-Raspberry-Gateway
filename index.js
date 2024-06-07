const axios = require('axios');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

// Replace '/dev/ttyS0' with your serial port path
const port = new SerialPort('/dev/ttyS0', { baudRate: 9600 });
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

// External server URL
const serverUrl = 'https://externalserver.com/api/sms-commands';

// Check server for commands every 5 minutes
setInterval(() => {
    axios.get(serverUrl)
        .then(response => {
            if (response.data && response.data.number && response.data.message) {
                sendSMS(response.data.number, response.data.message);
            }
        })
        .catch(error => console.error('Failed to fetch commands:', error));
}, 300000); // 5 minutes

// Function to send SMS
function sendSMS(number, message) {
    // Command to initialize SMS text mode
    port.write('AT+CMGF=1\r', (err) => {
        if (err) {
            return console.error('Error on write: ', err.message);
        }
        console.log('Text mode enabled for SMS');

        // Command to set recipient number
        port.write(`AT+CMGS="${number}"\r`, (err) => {
            if (err) {
                return console.error('Error on write: ', err.message);
            }
            console.log('Recipient number set');

            // Command to send message text followed by Ctrl+Z ASCII character
            port.write(`${message}\x1A`, (err) => {
                if (err) {
                    return console.error('Error on write: ', err.message);
                }
                console.log('Message sent');
            });
        });
    });
}

// Handle incoming data from SIM800L
parser.on('data', data => {
    console.log('Read data:', data);
});
