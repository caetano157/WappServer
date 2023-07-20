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
        console.log("Client iniciliazou com sucesso");
    })
    .catch((error) => {
        console.log("Erro inicializando o client:", error);
    });



function start(number, message) {
    return new Promise((resolve, reject) => {
        if (!client) {
            return reject("Client não iniciliazou. Aguarde a inicialização.");
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
        client.onMessage((message) => {
            if (message.body === 'status') {
                client
                    .sendText(message.from, "ONLINE")
                    .then((result) => {
                        //console.log('Result: ', result); //return object success
                        console.log("Mensagem enviada para - Mensagem: " + message + ", Número: " + number);
                    })
                    .catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        console.log("Enviando Mensagem - Mensagem: " + message + ", Número: " + number);
                    });
            }
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

/*
    start(number, message)
        .then((result) => {
            res.json({ success: true, result: result });
        })
        .catch((error) => {
            res.status(500).json({ success: false, error: error });
        });

*/