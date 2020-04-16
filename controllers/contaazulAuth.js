var credentials = require("../config/contaazulCredentials"); // caminho relacionado as credenciais

var client_id = credentials.client_id; // Your client id
var client_secret = credentials.client_secret; // Your secret

var stateKey = "contaazul_auth_state";

var request = require("request"); // "Request" library
var querystring = require("querystring");

//Gera uma string aleatória
var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var generateHeaderBasic = function (client_id, client_secret) {
  return (
    "Basic " + new Buffer(client_id + ":" + client_secret).toString("base64")
  );
};

module.exports = {
  authorize: function (req, res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = "sales";
    res.redirect(
      "https://api.contaazul.com/auth/authorize?" +
        querystring.stringify({
          client_id: client_id,
          scope: scope,
          state: state,
        })
    );
  },

  callback: function (req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
      res.redirect("/#" + querystring.stringify({ error: "state_mismatch" }));
    } else {
      res.clearCookie(stateKey);
      var authOptions = {
        url: "https://api.contaazul.com/oauth2/token",
        form: {
          code: code,
          grant_type: "authorization_code",
        },
        headers: {
          Authorization: generateHeaderBasic(client_id, client_secret),
        },
        json: true,
      };

      request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          // we can also pass the token to the browser to make requests from there
          res.redirect(
            "/#" +
              querystring.stringify({
                access_token: body.access_token,
                refresh_token: body.refresh_token,
              })
          );
        } else {
          console.log(error);
          res.redirect(
            "/#" + querystring.stringify({ error: "invalid_token" })
          );
        }
      });
    }
  },

  refreshToken: function (req, res) {
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
      url: "https://api.contaazul.com/oauth2/token",
      headers: { Authorization: generateHeaderBasic(client_id, client_secret) },
      form: {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        res.send({
          access_token: body.access_token,
          refresh_token: body.refresh_token,
        });
      } else {
        res.send({ error: error });
      }
    });
  },
};
