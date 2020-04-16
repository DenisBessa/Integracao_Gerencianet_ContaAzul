# App para integração entre a ContaAzul e a Gerencianet para emissão de boletos

## Introdução

Este é um pequeno aplicativo em node.js que exibe os dados

This command will download all the dependencies required by this example.

## Configurações

Para rodar o aplicativo, você deve informar as credenciais de cada uma das APIs nos arquvos dentro da pasta config.

## Running the example

To run the example just execute this command in the _node_ directory :

`$ node app.js`

Then access the example in the browser in `http://localhost:/8888`

## Dependencies

This example uses some dependencies to assist some steps :

- [cookie-parser](https://github.com/expressjs/cookie-parser) : stores and retrieves cookies
- [express](https://github.com/expressjs/express) : web framework for node
- [querystring](https://github.com/Gozala/querystring) : transform js objects in url params
- [request](https://github.com/request/request) : make http calls to the ContaAzul API
