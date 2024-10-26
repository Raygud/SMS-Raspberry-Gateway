const axios = require('axios');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const port = new SerialPort('/dev/ttyS0', { baudRate: 9600 });
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

const serverUrl = 'https://externalserver.com/api/sms-commands';

setInterval(() => {
    axios.get(serverUrl)
        .then(response => {
            if (response.data && response.data.number && response.data.message) {
                sendSMS(response.data.number, response.data.message);
            }
        })
        .catch(error => console.error('Failed to fetch commands:', error));
}, 300000); // 5 minutes

function sendSMS(number, message) {
    port.write('AT+CMGF=1\r', (err) => {
        if (err) {
            return console.error('Error on write: ', err.message);
        }
        console.log('Text mode enabled for SMS');

        port.write(`AT+CMGS="${number}"\r`, (err) => {
            if (err) {
                return console.error('Error on write: ', err.message);
            }
            console.log('Recipient number set');

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
