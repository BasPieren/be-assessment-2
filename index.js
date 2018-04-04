/*
Sources:
https://github.com/cmda-be/course-17-18/tree/master/examples/mysql-server
https://docs.google.com/presentation/d/1BHMqO9UV5ePt29n8cnjaznvye8Gu_HrdzhzC3h5rgOI/edit#slide=id.g2922825c54_2_58
*/

// Loads in all the dependencies
var express = require('express')
var session = require('express-session')
var bodyParser = require('body-parser')
var mysql = require('mysql')
var argon2 = require('argon2')

require('dotenv').config()

// Connect to the database
var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

connection.connect()

// Here we direct express to the correct callbacks
express()
  .use (express.static('static'))
  .use(bodyParser.urlencoded({extended: true}))
  .use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
  }))
  .set('view engine', 'ejs')
  .set('views', 'view')
  .get('/', dashboard)
  .get('/sign-up', signupForm)
  .post('/sign-up', signup)
  .get('/log-in', loginForm)
  .post('/log-in', login)
  .get('/log-out', logout)
  .listen(3000)

// When the browser calls for '/', send back dashboard.ejs
function dashboard(req, res) {
  connection.query('SELECT * FROM users', done)

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      res.render('dashboard.ejs', {data: data, user: req.session.user})
    }
  }
}

// When the browser calls for '/sign-up', send back sign-up.ejs
function signupForm(req, res) {
  connection.query('SELECT * FROM users', done)

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      res.render('sign-up.ejs', {data: data, user: req.session.user})
    }
  }
}

// When the signup form carries out its action, start this function
function signup(req, res, next) {
  var username = req.body.username;
  var age = req.body.age;
  var gender = req.body.gender;
  var description = req.body.description;
  var email = req.body.email;
  var password = req.body.password;
  var min = 8;
  var max = 160;

  if (!email || !password) {
    return res.status(400).send('Email of wachtwoord missen');
  }

  if (password.length < min || password.length > max) {
    return res.status(400).send(
      'Je wachtwoord moet tussen de ' + min +
      ' en ' + max + ' karakters zijn'
    )
  }

  connection.query('SELECT * FROM users WHERE username = ?', username, done)

  function done(err, data) {
    if (err) {
      next(err)
    } else if (data.length === 0) {
      argon2.hash(password).then(onhash, next)
    } else {
      res.status(409).send('Gebruikersnaam is al in gebruik')
    }
  }

  function onhash(hash) {
    connection.query('INSERT INTO users SET ?', {
      username: username,
      age:age,
      gender:gender,
      description:description,
      email:email,
      hash: hash},
      oninsert)

    function oninsert(err) {
      if (err) {
        next(err)
      } else {
        req.session.user = {username: username}
        res.redirect('/')
      }
    }
  }
}

// When the browser calls for '/log-in', send back log-in.ejs
function loginForm(req, res) {
  connection.query('SELECT * FROM users', done)

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      res.render('log-in.ejs', {data: data, user: req.session.user})
    }
  }
}

// When the login form carries out its action, start this function
function login(req, res, next) {
  var username = req.body.username
  var password = req.body.password

  if (!username || !password) {
    return res.status(400).send('Email of wachtwoord missen')
  }

  connection.query('SELECT * FROM users WHERE username = ?', username, done)

  function done(err, data) {
    var user = data && data[0]

    if (err) {
      next(err)
    } else if (user) {
      argon2.verify(user.hash, password).then(onverify, next)
    } else {
      res.status(401).send('Username does not exist')
    }

    function onverify(match) {
      if (match) {
        req.session.user = {username: user.username};
        res.redirect('/')
      } else {
        res.status(401).send('Password incorrect')
      }
    }
  }
}

// When the browser calls for '/log-out', destroy the current session and send the user back to '/'
function logout(req, res, next) {
  req.session.destroy(function (err) {
    if (err) {
      next(err)
    } else {
      res.redirect('/')
    }
  })
}
