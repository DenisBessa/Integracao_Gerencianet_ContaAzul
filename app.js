var express = require("express"); // Express web server framework
var cookieParser = require("cookie-parser");
var auth = require("./controllers/contaazulAuth.js");
var gerencianetBoleto = require("./controllers/gerencianetBoleto");
var bodyParser = require("body-parser");

var app = express();

app.use(express.static(__dirname + "/public")).use(cookieParser());
app.use(bodyParser.json());

app.get("/login", auth.authorize);
app.get("/callback", auth.callback);
app.get("/refresh_token", auth.refreshToken);
app.get("/emite_boleto", gerencianetBoleto.emiteBoleto);

console.log("Listening on 80");
app.listen(80);
