/* ---
This project makes use of the following sources provided by [Titus Wormer](https://github.com/wooorm):
* [plain-server](https://github.com/cmda-be/course-17-18/tree/master/examples/plain-server)
* [express-server](https://github.com/cmda-be/course-17-18/tree/master/examples/express-server)
* [mysql-server](https://github.com/cmda-be/course-17-18/tree/master/examples/mysql-server)
* [Backend Development Lecture 6](https://docs.google.com/presentation/d/1BHMqO9UV5ePt29n8cnjaznvye8Gu_HrdzhzC3h5rgOI/edit#slide=id.g2922825c54_2_58)
* [Backend Development Lab 8](https://docs.google.com/presentation/d/17acFykwNaTmiiPZJElAqBfz-9XlvuRf6KNU2t-Bm5w0/edit#slide=id.g2922825c54_2_58)
--- */

// Loads in all the dependencies
var express = require('express') // Loads in express, a node.js framework
var session = require('express-session') // Loads in express session which uses cookies to store a users session
var bodyParser = require('body-parser') // Loadis in body parser and parser the things you give it
var mysql = require('mysql') // Loads in mysql which makes it possible to use sql inside this document
var argon2 = require('argon2') // Loads in argon 2 which hashes a users password for protection
var multer = require('multer') // Loads in multer which makes it possible to upload files

require('dotenv').config();

// Connect to the database with the information inside the .env file
var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect();

// Places all the uploaded images in the 'static/upload/' folder
var upload = multer({dest: 'static/upload/'});

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
  .get('/:id', profile)
  .get('/dashboard', dashboard)

  .post('/sign-up', upload.single('cover'), signup)
  .post('/log-in', login)

  .listen(3000)

/* ---
START USE OF SOURCES:
* [plain-server](https://github.com/cmda-be/course-17-18/tree/master/examples/plain-server)
* [express-server](https://github.com/cmda-be/course-17-18/tree/master/examples/express-server)
* [mysql-server](https://github.com/cmda-be/course-17-18/tree/master/examples/mysql-server)
* [Backend Development Lecture 6](https://docs.google.com/presentation/d/1BHMqO9UV5ePt29n8cnjaznvye8Gu_HrdzhzC3h5rgOI/edit#slide=id.g2922825c54_2_58)
* [Backend Development Lab 8](https://docs.google.com/presentation/d/17acFykwNaTmiiPZJElAqBfz-9XlvuRf6KNU2t-Bm5w0/edit#slide=id.g2922825c54_2_58)
--- */

// When the browser calls for '/', send back start.ejs
function start(req, res) {
  // Connect to the database with done as callback
  connection.query('SELECT * FROM users', done);

  function done(err, data) {
    if (err) {
      next(err);
    } else {
      // Render the start.ejs file with the data from the database
      res.render('start.ejs', {data: data});
    }
  }
}

// When the browser calls for '/sign-up', send back sign-up.ejs
function signupForm(req, res) {
  // Connect to the database with done as callback
  connection.query('SELECT * FROM users', done);

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      // Render the sign-up.ejs file with the data from the database
      res.render('sign-up.ejs', {data: data});
    }
  }
}

// When the signup form carries out its post action, start this function
function signup(req, res, next) {
  // Look up all the information fields the user is gonna fill in and store them in variables.
  var username = req.body.username;
  var age = req.body.age;
  var gender = req.body.gender;
  var description = req.body.description;
  var picture = req.file ? req.file.filename : null;
  var email = req.body.email;
  var password = req.body.password;
  var min = 8;
  var max = 160;

  // Give an error when the users trys to submit the form without email or password
  if (!email || !password) {
    return res.status(400).send('Email of wachtwoord missen');
  }

  // Give an error when the users trys to submit the form where the password is to short or to long
  if (password.length < min || password.length > max) {
    return res.status(400).send(
      'Je wachtwoord moet tussen de ' + min +
      ' en ' + max + ' karakters zijn'
    );
  }

  // Connect to the database and check if the username exists
  connection.query('SELECT * FROM users WHERE username = ?', username, done);

  // If it doesn't, carry out the following function
  function done(err, data) {
    if (err) {
      next(err);
    } else if (data.length === 0) {
      // If there is no data hash the password and carry out the onhash callback
      argon2.hash(password).then(onhash, next);
    } else {
      // If the username all ready exists send back an error
      res.status(409).send('Gebruikersnaam is al in gebruik');
    }
  }

  function onhash(hash) {
    // Save all the new user information inside the database
    connection.query('INSERT INTO users SET ?', {
      username: username,
      age:age,
      gender:gender,
      description:description,
      picture:picture,
      email:email,
      hash: hash
    },
      oninsert);

    // When all the information is saved start this function
    function oninsert(err) {
      if (err) {
        next(err);
      } else {
        // Save the username inside the current session and redirect the user to the dashboard
        req.session.user = {username: username};
        res.redirect('dashboard');
      }
    }
  }
}

// When the browser calls for '/log-in', send back log-in.ejs
function loginForm(req, res) {
  // Connect to the database with done as callback
  connection.query('SELECT * FROM users', done);

  function done(err, data) {
    if (err) {
      next(err);
    } else {
      // Render the log-in.ejs file with the data from the database
      res.render('log-in.ejs', {data: data, user: req.session.user});
    }
  }
}

// When the login form carries out its action, start this function
function login(req, res, next) {
  // Look up the information fields the user is gonna fill in and store them in variables.
  var username = req.body.username;
  var password = req.body.password;

  // Connect to the database and check if the username exists then start the done callback
  connection.query('SELECT * FROM users WHERE username = ?', username, done);

  function done(err, data) {
    var user = data && data[0];

    if (err) {
      next(err);
    } else if (user) {
      // If the username exists start to verify the given password with saved password and carry out the onverify callback
      argon2.verify(user.hash, password).then(onverify, next);
    } else {
      // If the username doesn't exists send back an error
      res.status(401).send('Username does not exist');
    }

    function onverify(match) {
      if (match) {
        // Save the username inside the current session and redirect the user to the dashboard
        req.session.user = {username: username};
        res.redirect('dashboard');
      } else {
        // If the password if incorrect send back an error
        res.status(401).send('Password incorrect');
      }
    }
  }
}

// When the browser calls for '/dashboard', send back dashboard.ejs
function dashboard(req, res, next) {
  // Connect to the database with done as callback
  connection.query('SELECT * FROM users', done);

  function done(err, data) {
    if (err) {
      next(err);
    } else {
      // Render the dashboard.ejs file with the data from the database
      res.render('dashboard.ejs', {data: data, user: req.session.user});
    }
  }
}

// When the browser calls for '/:id', send back profile.ejs
function profile(req, res, next) {
  // Save the requested id in side a variable
  var id = req.params.id;

  // Connect to the database and check if the id exists then start the done callback
  connection.query('SELECT * FROM users WHERE id = ?', id, done);

  function done(err, data) {
    if (err) {
      next(err);
    } else if (data.length === 0) {
      next();
    } else {
      // If the id exists render profile.ejs with the associated information of the user
      res.render('profile.ejs', {data: data[0], user: req.session.user});
    }
  }
}

// When the browser calls for '/log-out', destroy the current session and send the user back to '/'
function logout(req, res, next) {
  req.session.destroy(function (err) {
    if (err) {
      next(err);
    } else {
      res.redirect('/');
    }
  })
}

/* ---
END USE OF SOURCES
--- */
