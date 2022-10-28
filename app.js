const express = require('express');
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require('path');
const app = express();
const port = 7777;
const router = express.Router();
const bodyParser = require('body-parser');
const createError = require('http-errors');
const mongodb = require('mongodb').MongoClient

let db;

//require('dotenv').config();

////////////////////////////////////
// Basic Configuration
////////////////////////////////////
app.use(session({
  secret: "No secrete",
  saveUninitialized: true,
  cookie: { maxAge: 30000 },
  resave: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.listen(port,()=>{console.log(`Server listening on ${port}`);})
app.use('/images',express.static(__dirname+'/public/images'));
app.use('/javascripts',express.static(__dirname+'/public/javascripts'));
app.use('/stylesheets',express.static(__dirname+'/public/stylesheets'));

let connectionString = 'mongodb://localhost:27017/foodkeeper'
dbConn = mongodb.connect(
  connectionString,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err, client) {
    db = client.db()
    console.log("db connected");
   // app.listen(7777)
  }
)

// Set Favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname+'/public/images/favicon.ico'));
});

////////////////////////////////////
// Page Redirection
////////////////////////////////////
router.get('/', function(req,res){
  res.sendFile(path.join(__dirname+'/views/index.html'));
}); 

router.get('/list', function(req,res){
  res.sendFile(path.join(__dirname+'/views/shopping-list.html'));
}); 

router.get('/storage', function(req, res) {
  res.sendFile(path.join(__dirname+'/views/storage-list.html'));
});

////////////////////////////////////
// Routing
////////////////////////////////////
let mongoUtil = require('./db/mongoUtil');

// Create a reusable shared db connection 
mongoUtil.connectToServer((err) => {
  let authRouter = require("./routes/auth.js");
  let itemRouter = require('./routes/items.js');
  let storageRouter = require("./routes/storage-route.js");
  
  app.use('/', router);
  app.use('/', authRouter);
  app.use('/item', itemRouter);
  app.use('/api/storage', storageRouter);

  // Forward 404 to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

  // Error handler
  app.use(function(err, req, res) {
    res.locals.message = err.message;
    res.locals.error = err || "MongoDB connection error.";
    res.status(err.status || 500);
    res.render('error');
  });
});

app.post('/item',function(req,res){
  db.collection('items').insertOne(req.body);
  res.status(204).send();
});


//const buyRouter = require('./routes/buy.js');
//app.use('/buy',buyRouter);
app.post('/buy',function(req,res){
  db.collection('buys').insertOne(req.body);
  res.status(204).send();
  //res.send('Data received:\n' + JSON.stringify(req.body));
});

app.use('/',router);

app.get('/buy',(req,res)=>{
  db.collection('buys').find().toArray((err,result)=>{
    if (err) return console.log(err);
    res.status(200).json(result);;
  })
});

app.delete('/done',(req,res)=>{
  db.collection('buys').deleteMany();
  console.log(res);
})

module.exports = app;

// Setting Favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname+'/public/images/favicon.ico'));
});


////////////////////////////////////
////////////////////////////////////
// Shane's Playground
////////////////////////////////////
////////////////////////////////////
function print(path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))))
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))))
  } else if (layer.method) {
    console.log('%s /%s',
      layer.method.toUpperCase(),
      path.concat(split(layer.regexp)).filter(Boolean).join('/'))
  }
}

function split(thing) {
  if (typeof thing === 'string') {
    return thing.split('/')
  } else if (thing.fast_slash) {
    return ''
  } else {
    var match = thing.toString()
      .replace('\\/?', '')
      .replace('(?=\\/|$)', '$')
      .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//)
    return match
      ? match[1].replace(/\\(.)/g, '$1').split('/')
      : '<complex:' + thing.toString() + '>'
  }
}

// Print all routes
app._router.stack.forEach(print.bind(null, []))
////////////////////////////////////