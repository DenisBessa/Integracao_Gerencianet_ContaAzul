# App para integração entre a ContaAzul e a Gerencianet para emissão de boletos

## Introdução

Este é um pequeno aplicativo em node.js que extrai os dados de vendas realizadas no ContaAzul, com filtros, e emite boletos da Gerencianet.

## Configurações

Para rodar o aplicativo, você deve informar as credenciais de cada uma das APIs nos arquvos dentro da pasta config.

## Executando o aplicativo

O aplicativo ainda está em uma fase muito inicial, e não tem interface para emissão de boletos. Por isso, para emitir um boleto, siga as instruções:

1. Execute o aplicativo utilizando o node.js, com o comando `\$ node app.js`;

2. Acesse o aplicativo no endereço `http://localhost` e anote o access token;

3. Para emitir um boleto, faça uma requisição POST neste formato: `localhost/emite_boleto?access_token={seu_access_token}&data_inicio={filtro_de_data_fim}&{filtro_de_data_inicio}=2020-04-30`
