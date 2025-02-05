const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const bodyParser = require('body-parser')
const venom = require('venom-bot');
let client; // Declare the client variable at the top level to have access in the entire application
const port = process.env.PORT || 21117; // Use a variável de ambiente PORT ou 4000 como padrão
console.log("Rodando na porta:" + port)
venom
    .create({
        session: 'G4', //name of session
    })
    .then((waClient) => {
        client = waClient; // Store the client instance in the variable
        start(client);
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
        let number = req.body.number;
        let message = req.body.message;
        enviarMensagemPessoa(number, message).then((result) => {
            res.status(200).json({ success: true, result: result });
        })
        .catch((error) => {
            res.status(500).json({ success: false, error: error });
        });
    })
    app.post('/send_groupmessage', (req, res) => {
        let number = req.body.number;
        let message = req.body.message;
        enviarMensagemGrupo(number, message).then((result) => {
            res.status(200).json({ success: true, result: result });
        })
        .catch((error) => {
            res.status(500).json({ success: false, error: error });
        });
    })
    app.listen(port, () => {
        console.log('Example app listening on port: ' + port)
    }) 
    function enviarMensagemPessoa(number, message) {
        return new Promise((resolve, reject) => {
            if (!client) {
                return reject("Client não iniciliazou. Aguarde a inicialização.");
            }
            const formattedNumber = number + "@c.us";
            client
                .sendText(formattedNumber, message)
                .then((result) => {
                    var dataHora = obterData()
                    console.log(dataHora + ' Mensagem enviada com sucesso');
                    resolve("Mensagem Enviada");
                    //resolve(result);
                })
                .catch((error) => {
                    var dataHora = obterData()
                    console.error(dataHora + ' Erro ao enviar a mensagem:', error.text);
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
    function enviarMensagemGrupo(number, message) {
        return new Promise((resolve, reject) => {
            if (!client) {
                return reject("Client não iniciliazou. Aguarde a inicialização.");
            }
            const formattedNumber = number + "@g.us";
            client
                .sendText(formattedNumber, message)
                .then((result) => {
                    var dataHora = obterData()
                    console.log(dataHora + ' Mensagem enviada com sucesso');
                    resolve("Mensagem Enviada");
                    //resolve(result);
                })
                .catch((error) => {
                    var dataHora = obterData()
                    console.error(dataHora + ' Erro ao enviar a mensagem:', error.text);
                    reject(error);
                });
            client.onMessage((message) => {
                if (message.body === 'status') {
                    client
                        .sendText(message.from, "ONLINE")
                        .then((result) => {
                            var dataHora = obterData()
                            console.log(result)
                            console.log(dataHora + ' Mensagem de status enviada');
                        })
                        .catch((erro) => {
                            console.log(erro)
                            var dataHora = obterData()
                            console.log(dataHora + " Enviando Mensagem - Mensagem: " + message + ", Número: " + number);
                        });
                }
            });
        });
    }
    function obterData(){
        var hoje = new Date();
        var ano = hoje.getFullYear();
        var mes = hoje.getMonth()+1;
        if (mes<10){
            mes = '0' + mes
        }
        var dia = hoje.getDate();
        if (dia<10){
            dia = '0' + dia
        }
        var hora = hoje.getHours();
        if (hora<10){
            hora = '0' + hora
        }        
        var minuto = hoje.getMinutes();
        if (minuto<10){
            minuto = '0' + minuto
        }
        var segundo = hoje.getSeconds();
        if (segundo<10){
            segundo = '0' + segundo
        }
        var dataSaida = '[' + dia +'/'+ mes +'/'+ ano +' ' + hora +':' + minuto + ':' + segundo +']';
        return dataSaida
    }
    function start(client) {
        client.onMessage((message) => {
          if(message.body === 'status') {
            client
              .sendText(message.from, 'ONLINE')
              .then((result) => {
                var dataHora = obterData()
                    console.log(dataHora + " - Enviando Mensagem de notificação");
              })
              .catch((erro) => {
                console.error('Error when sending: ', erro); //return object error
              });
          } if(message.isGroupMsg === false && (message.body.toUpperCase() === "CONFIRMADO" || message.body.toUpperCase() === "CONFIRMO" || message.body.toUpperCase() === "CONFIRMEI" || message.body.toUpperCase() === "CONFIRMA" || message.body.toUpperCase() === "CONFIRMADA")) {
            client
              .sendText(message.from, '*Essa mensagem é automática*\nA confirmação pelo link é obrigatória! Basta clicar uma vez para que sua sessão seja confirmada.\nSe houver algum erro, encaminhe uma imagem para verificarmos 😉')
              .then((result) => {
                    var dataHora = obterData()
                    console.log(dataHora + " - Enviando Mensagem de notificação");
              })
              .catch((erro) => {
                console.error('Error when sending: ', erro); //return object error
              });
          }
        });
      }


            

