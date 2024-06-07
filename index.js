require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const bodyParser = require('body-parser');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

let urlDatabase = {};
let urlCounter = 1;

// Ruta para acortar una URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validar la URL utilizando una expresión regular
  const urlPattern = /^(http|https):\/\/[^ "]+$/;
  if (!urlPattern.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // Extraer el hostname para usar dns.lookup
  const hostname = url.parse(originalUrl).hostname;

  dns.lookup(hostname, (err, addresses) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Crear una nueva entrada en la base de datos
    const shortUrl = urlCounter++;
    urlDatabase[shortUrl] = originalUrl;

    // Responder con la URL original y la URL acortada
    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// Ruta para redirigir a la URL original
app.get('/api/shorturl/:shortUrl', (req, res) => {
  const shortUrl = req.params.shortUrl;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No URL found' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
