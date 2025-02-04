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
    },
{
headless: new
},
)
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
          } if(message.isGroupMsg === false && (message.body === "SIM" || message.body === "Sim" || message.body === "sim" || message.body === "CONFIRMAR" || message.body === "Confirmar" || message.body === "confirmar" || message.body === "CONFIRMADO" || message.body === "Confirmado" || message.body === "confirmado")) {
            client
              .sendText(message.from, 'Atendimento confirmado!\n\nAtenção às informações:\n‼️ A área agendada deve ser depilada com lâmina no dia da sessão, caso contrário a sessão será reagendada, com exceção caso a aplicadora tenha orientado que venha com pontas de pelo na próxima sessão! (traga sua lâmina individual se necessário reparo).\n❗ Caso haja alguma parcela em aberto, a mesma precisa ser acertada antes do atendimento. Caso contrário, não conseguiremos realizar a sessão devido a restrição no próprio sistema.\n❗️Lembre-se sempre de manter a área hidratada!\n❗Sessão no rosto > Traga seu Protetor Solar!\n‼️Se expôs ao sol nos últimos 7 dias? A sessao deve ser reagendada. A sessao não deve ser feita com a pele vermelha e sensível por conta de exposição ao sol!\n\n⚠️ Lembrando que os clientes tem exatos 5 minutos de tolerância!')
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


            

