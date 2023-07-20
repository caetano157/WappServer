const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();

const venom = require('venom-bot');
let client; // Declare the client variable at the top level to have access in the entire application

venom
    .create({
        session: 'G1' //name of session
    })
    .then((waClient) => {
        client = waClient; // Store the client instance in the variable
        console.log("Client initialized successfully!");
    })
    .catch((error) => {
        console.log("Error initializing the client:", error);
    });

function start(number, message) {
    return new Promise((resolve, reject) => {
        if (!client) {
            return reject("Client is not initialized. Please wait for the client to be ready.");
        }

        const formattedNumber = number + "@c.us";

        client
            .sendText(formattedNumber, message)
            .then((result) => {
                console.log('Mensagem enviada com sucesso:', result);
                resolve(result);
            })
            .catch((error) => {
                console.error('Erro ao enviar a mensagem:', error);
                reject(error);
            });
    });
}

/* Enviar mensagem */
router.get('/send_message/:number/:message', function(req, res, next) {
    const number = req.params.number;
    const message = req.params.message;
    console.log("Enviando Mensagem - Mensagem: " + message + ", Número: " + number);

    start(number, message)
        .then((result) => {
            res.json({ success: true, result: result });
        })
        .catch((error) => {
            res.status(500).json({ success: false, error: error });
        });
});

app.use('/', router);
app.listen(process.env.PORT || 4000, () => {
    console.log('Server is running on port 4000');
});