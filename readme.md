# be-assessment-2 | Dating App
This is the repo for my assessment 2 project where I made a dynamic website using Git, Node.js, Express, SQL and MYSQL.

![Dating App Start Screenshot](images/dating_app_start_screenshot.png)

## To Do
This is a list of things in want to do in this project.
- [x] Create an account
- [x] Login / Logout
- [x] View profile(s)
- [ ] Edit own profile information
- [ ] Find matches
- [ ] Send a chat message

## Description

### Start
The starting page is the first screen users will see. Here they can create an account or login to an existing one.

### Sign up
Add the sign up page users can create their account. They need to fill in the following information:

* Name
* Age
* Gender
* Description
* Profile Picture
* Email
* Password

All this information gets saved into the database.

### Login
Add the login screen the user can login with there username and password that they created during the sign up process.

### Dashboard
At the dashboard the users will find all his potential matches. He can also navigate to his own profile and logout.

### Profile
At the profile page the user can see his own profile information.

## Installing
To install this application enter the following into your _terminal_:
```
git clone https://github.com/BasPieren/be-assessment-2.git
cd be-assessment-2
npm install
```

To start the server enter the following:  
`node server`

### Database
After installing you will also have to create a MYSQL database as a place to store all data.

First login to your account:
```
mysql -u your-username -p
```

Then run the following SQL to setup your database and enter it:
```
CREATE DATABASE IF NOT EXISTS mydatingapp;
USE mydatingapp
```

After creating the database run the following SQL to create the users table:
```
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  username TEXT CHARACTER SET utf8,
  age TEXT CHARACTER SET utf8,
  gender TEXT CHARACTER SET utf8,
  description TEXT CHARACTER SET utf8,
  picture TEXT CHARACTER SET utf8,
  email TEXT CHARACTER SET utf8,
  hash TEXT CHARACTER SET utf8,
  PRIMARY KEY (id)
);
```

### Packages and technologies
* [argon2](https://www.npmjs.com/package/argon2)
* [body-parser](https://www.npmjs.com/package/body-parser-json)
* [dotenv](https://www.npmjs.com/package/dotenv)
* [ejs](https://www.npmjs.com/package/ejs)
* [express](https://www.npmjs.com/package/express)
* [express-session](https://www.npmjs.com/package/express-sessions)
* [nodemon](https://www.npmjs.com/package/nodemon)
* [mysql](https://www.npmjs.com/package/mysql)
* [multer](https://www.npmjs.com/package/multer)

### Structure

## Licence

MIT © [Bas Pieren](https://github.com/BasPieren)
