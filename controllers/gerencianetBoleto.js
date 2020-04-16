/*
Esse módulo recebe solicitações POST vindas do endereço /emite_boleto. Essas solicitações possuem o access token, uma data inicial e uma data final. Por exemplo:
dev.local/emite_boleto?access_token=XBt7s4MiPw2WhrWT6UWMx46COD4ISz63&data_inicio=2020-04-01&data_fim=2020-04-30
Com esses dados em mãos, fazemos uma consulta no ContaAzul para verificar as vendas do período, e fazemos um loop pelas vendas para emitir um boleto  na Gerencianet para cada parcela de cada venda.
*/

var Gerencianet = require("gn-api-sdk-node"); // caminho relacionado a SDK da Gerencianet
var gerencianetCredentials = require("../config/gerencianetCredentials"); // caminho relacionado as credenciais da Gerencianet
var requestPromise = require("request-promise");

//Monta variável montaRequestVendas, com a qual a pesquisa da venda será feita na ContaAzul
function montaRequestVendas(data_inicio, data_fim, access_token) {
  var retorno = {
    method: "GET",
    url:
      "https://api.contaazul.com/v1/sales?emission_start=" +
      data_inicio +
      "&emission_end=" +
      data_fim,
    headers: {
      Authorization: "Bearer " + access_token,
    },
  };
  return retorno;
}

//Monta variável montaRequestItens, com a qual a pesquisa dos itens de cada venda será feita na ContaAzul
function montaRequestItens(venda, access_token) {
  var retorno = {
    method: "GET",
    url: "https://api.contaazul.com/v1/sales/" + venda + "/items",
    headers: {
      Authorization: "Bearer " + access_token,
    },
  };
  return retorno;
}

//Monta variável montaRequestCliente, com a qual a pesquisa do cliente de cada venda será feita na ContaAzul
function montaRequestCliente(cliente, access_token) {
  var retorno = {
    method: "GET",
    url: "https://api.contaazul.com//v1/customers/" + cliente,
    headers: {
      Authorization: "Bearer " + access_token,
    },
  };
  return retorno;
}

module.exports = {
  emiteBoleto: async function (req, res) {
    //Recebe, como parâmetro da requisição, os valores de access_token, data_inicio e data_fim, para fazer a pesquisa no ContaAzul da vendas com esses filtros
    let access_token = req.query.access_token;
    let data_inicio = req.query.data_inicio;
    let data_fim = req.query.data_fim;

    //Monta as requests para obter os dados da venda no ContaAzul
    let requestVendas = montaRequestVendas(data_inicio, data_fim, access_token);

    //Faz a pesquisa na ContaAzul utilizando a variável requestVendas
    let retornoVendas = JSON.parse(await requestPromise(requestVendas));

    //Faz um loop pelas vendas retornadas, pegando cada venda, obtendo os dados adicionais e emitindo um boleto para cada parcela
    for (let index = 0; index < retornoVendas.length; index++) {
      let retornoVenda = retornoVendas[index];

      //Monta a request para obter os itens da venda
      let requestItens = montaRequestItens(retornoVenda.id, access_token);

      //Faz a pesquisa na ContaAzul utilizando a variável requestItens
      let retornoItens = JSON.parse(await requestPromise(requestItens));

      //Monta a request para obter os dados co cliente da venda
      cliente = retornoVenda.customer.id;
      requestCliente = montaRequestCliente(cliente, access_token);

      //Faz a pesquisa na ContaAzul utilizando a variável requestCliente
      let retornoCliente = JSON.parse(await requestPromise(requestCliente));

      //Pega os itens da ContaAzul e coloca num array para ser usado na requisicao da Gerencianet
      let itensGereencianet = [];
      retornoItens.forEach((itemContaazul) => {
        let itemGerencianet = {};
        itemGerencianet.name = itemContaazul.item.name;
        itemGerencianet.value = itemContaazul.value * 100;
        itemGerencianet.amount = itemContaazul.quantity;
        itensGereencianet.push(itemGerencianet);
      });

      //Faz um loop por cada uma das prestações do ContaAzul para emitir um boleto para cada
      let prestacoes = retornoVenda.payment.installments;
      for (let index = 0; index < prestacoes.length; index++) {
        const prestacao = prestacoes[index];

        //Define os valores do objeto optionsGerencianet, que será usado para a requisição da Gerencianet
        //Aqui tem um if que verifica o tamanho do campo document no ContaAzul, pois a Gerencianet tem campos diferentes para CNPJ e CPF
        let requestGerencianet;

        if ((Object.keys(retornoCliente.document).length = 14)) {
          requestGerencianet = {
            items: itensGereencianet,
            metadata: {
              custom_id: retornoVenda.id,
            },
            payment: {
              banking_billet: {
                customer: {
                  name: retornoCliente.name,
                  juridical_person: {
                    corporate_name: retornoCliente.name,
                    cnpj: retornoCliente.document,
                  },
                  email: "denis@contabilidadebessa.com.br",
                  phone_number: "31998856461",
                },
                expire_at: prestacao.due_date.slice(0, 10),
              },
            },
          };
        } else {
          requestGerencianet = {
            items: itensGereencianet,
            metadata: {
              custom_id: retornoVenda.id,
            },
            payment: {
              banking_billet: {
                customer: {
                  name: retornoCliente.name,
                  cpf: retornoCliente.document,
                  email: "denis@contabilidadebessa.com.br",
                  phone_number: "31998856461",
                },
                expire_at: prestacao.due_date.slice(0, 10),
              },
            },
          };
        }

        //Obtém as credenciais dentro do arquivo /config/gerencianetCredentials.js
        var credenciaisGerencianet = {
          client_id: gerencianetCredentials.client_id,
          client_secret: gerencianetCredentials.client_secret,
          sandbox: gerencianetCredentials.sandbox,
        };

        console.log(requestGerencianet);

        //Agora faz a request para a Gerencianet
        var gerencianet = new Gerencianet(credenciaisGerencianet);
        try {
          //Emite o boleto na Gerencianet
          await gerencianet.oneStep({}, requestGerencianet).then(console.log);
          res.status(200).send("Boleto emitido com sucesso");
        } catch {
          (err) => {
            console.log(err);
            res.status(500).json({ message: err });
          };
        }
      }
    }
  },
};
