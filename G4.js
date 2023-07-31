const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const bodyParser = require('body-parser')
const venom = require('venom-bot');
let client; // Declare the client variable at the top level to have access in the entire application
port = 4000;
venom
    .create({
        session: 'G4' //name of session
    })
    .then((waClient) => {
        client = waClient; // Store the client instance in the variable
        console.log("Client iniciliazou com sucesso");
    })
    .catch((error) => {
        console.log("Erro inicializando o client:", error);
    });

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
     
    app.get('/', (req, res) => {
      res.send('Servidor de envio de mensagens - C0D4R')
    })
     
    app.post('/send_message', (req, res) => {
        let data = req.body;
        let number = req.body.number;
        let message = req.body.message;
        start(number, message).then((result) => {
            res.status(200).json({ success: true, result: result });
        })
        .catch((error) => {
            res.status(500).json({ success: false, error: error });
        });
        /* res.send('Data Received: ' + JSON.stringify(data)); */
    })
  
    function start(number, message) {
        return new Promise((resolve, reject) => {
            if (!client) {
                return reject("Client não iniciliazou. Aguarde a inicialização.");
            }
            const formattedNumber = number + "@c.us";
            client
                .sendText(formattedNumber, message)
                .then((result) => {
                    console.log('Mensagem enviada com sucesso');
                    resolve("Mensagem Enviada");
                    //resolve(result);
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
     
    app.listen(port, () => {
      console.log('Example app listening on port 4000!')
    })


