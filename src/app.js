require('dotenv').config();

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')

const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true});
mongoose.set('debug', true);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback){
  console.log("Connection Succeeded");
});

var Schema = mongoose.Schema;

var showSchema = new Schema({
  name: String
});

var pageSchema = new Schema({
  name: String
});

var Show = mongoose.model('Show', showSchema, 'shows');

var Page = mongoose.model('Page', pageSchema, 'show_page');

app.get('/shows', (req, res) => {
  Show.find({}, function (error, shows) {
    if (error) { console.log(error); }
    res.send({
      shows: shows
    })
  })
})

app.get('/show_page', (req, res) => {
  Page.find({}, function (error, show_page) {
    if (error) { console.log(error); }
    res.send({
      pages: show_page
    })
  })
})

app.listen(process.env.PORT || 8081)
