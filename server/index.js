/*
Sources:
https://github.com/cmda-be/course-17-18/tree/master/examples/mysql-server
https://docs.google.com/presentation/d/1BHMqO9UV5ePt29n8cnjaznvye8Gu_HrdzhzC3h5rgOI/edit#slide=id.g2922825c54_2_58
*/

// Loads in all the dependencies
var express = require('express') // Loads in express, a node.js framework
var session = require('express-session') // Loads in express session which uses cookies to store a users session
var bodyParser = require('body-parser')
var mysql = require('mysql')
var argon2 = require('argon2') // Loads in argon 2 which hashes a users password for protection
var multer = require('multer') // Loads in multer which makes it possible to upload files

require('dotenv').config()

// Connect to the database with the information inside the .env file
var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

connection.connect()

// Places all the uploaded images in the 'static/upload/' folder
var upload = multer({dest: 'static/upload/'})

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

  .get('/', start)
  .get('/sign-up', signupForm)
  .get('/log-in', loginForm)
  .get('/log-out', logout)
  .get('/profile', profile)
  .get('/dashboard', dashboard)

  .post('/sign-up', upload.single('cover'), signup)
  .post('/log-in', login)

  .listen(3000)

// When the browser calls for '/', send back start.ejs
function start(req, res) {
  connection.query('SELECT * FROM users', done) // Connect to the database with done as callback

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      res.render('start.ejs', {user: req.session.user})
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
      res.render('sign-up.ejs', {user: req.session.user})
    }
  }
}

// When the signup form carries out its action, start this function
function signup(req, res, next) {
  var username = req.body.username;
  var age = req.body.age;
  var gender = req.body.gender;
  var description = req.body.description;
  var picture = req.file ? req.file.filename : null;
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
      picture:picture,
      email:email,
      hash: hash},
      oninsert)

    function oninsert(err) {
      if (err) {
        next(err)
      } else {
        req.session.user = {username: username};
        res.render('dashboard.ejs', {user: req.session.user})
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
      res.render('log-in.ejs', {user: req.session.user})
    }
  }
}

// When the login form carries out its action, start this function
function login(req, res, next) {
  var username = req.body.username
  var password = req.body.password

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
        req.session.user = {username: username};
        res.render('dashboard.ejs', {user: req.session.user})
      } else {
        res.status(401).send('Password incorrect')
      }
    }
  }
}

function dashboard(req, res) {
  connection.query('SELECT * FROM users', done)

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      res.render('dashboard.ejs', {user: req.session.user})
    }
  }
}

function profile(req, res) {
  connection.query('SELECT * FROM users', done)

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      res.render('profile.ejs', {user: req.session.user})
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
