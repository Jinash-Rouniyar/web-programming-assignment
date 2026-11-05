const express = require("express");
const crypt = require("crypto");
const mysql = require("mysql2");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 3000;

// Parse form bodies and serve HTML files from the public folder
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// cookie-parser must run before express-session
app.use(cookieParser());

/*
  Session middleware (from the class sessionbasedauth sample)
  Stores data on the server and sends a session ID cookie to the browser.
  After login we save the username in req.session so /profile can read it.
*/
app.use(
	session({
		secret: "your-secure-secret-key", // Used to sign the session ID cookie
		resave: false, // Prevents resaving unchanged sessions
		saveUninitialized: false, // Prevents storing empty, uninitialized sessions
		cookie: {
			maxAge: 60000 * 60, // Cookie expiry in milliseconds (1 hour)
			httpOnly: true, // Protects against XSS attacks
			secure: false, // Set to true if using HTTPS
		},
	})
);

// MySQL connection — set ROOTPASS in your environment
const pass = process.env.ROOTPASS;
const conn = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: pass,
	database: "paws",
	port: 3306,
});

const hashRounds = 100;
const hashLength = 64;
const salt = "salt";

conn.connect(function (err) {
	if (err) {
		console.log("Couldnt connect to MySQL", err);
	} else {
		console.log("Database connection established");
	}
});

/*
  Create the users table once if it does not exist:
  username, email, hashed password, and salt
*/
conn.query(
	`CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(100) NOT NULL UNIQUE,
		email VARCHAR(200) NOT NULL,
		password VARCHAR(255) NOT NULL,
		salt VARCHAR(100) NOT NULL
	)`,
	function (err) {
		if (err) {
			console.log("Could not ensure users table exists", err);
		}
	}
);

// Register a new user, then send a success message with a link to login.html
app.post("/register", function (req, res) {
	let plainPass = req.body.password;
	let username = req.body.username;
	let email = req.body.email;

	// Hash the password before storing it (same approach as the login sample)
	let hashedPass = crypt
		.pbkdf2Sync(plainPass, salt, hashRounds, hashLength, "sha512")
		.toString("hex");

	let sql =
		"INSERT INTO users (username, email, password, salt) VALUES (?, ?, ?, ?)";

	conn.query(sql, [username, email, hashedPass, salt], function (err, result) {
		if (err) {
			console.log("There was an error registering a user", err);
			res.send(
				"<p>Registration failed. That username may already be taken.<br>" +
					'<a href="register.html">Try again</a></p>'
			);
		} else {
			res.send(
				"<p>You have successfully registered.</p>" +
					'<p><a href="login.html">Login</a> here</p>'
			);
		}
	});
});

/*
  Login: check username + hashed password.
  On success, store the username in the session so other pages can use it.
*/
app.post("/login", function (req, res) {
	let plainPass = req.body.password;
	let username = req.body.username;
	let saltVal = "salt";

	const hashedPass = crypt
		.pbkdf2Sync(plainPass, saltVal, hashRounds, hashLength, "sha512")
		.toString("hex");

	let sql = "SELECT * FROM users WHERE username = ? AND password = ?";

	conn.query(sql, [username, hashedPass], function (err, result) {
		if (err) {
			res.send(err);
		} else {
			if (result.length === 0) {
				console.log("results of the query", result);
				res.send(
					"<p>The login credentials were incorrect.</p>" +
						'<p><a href="login.html">Login</a> here</p>'
				);
			} else {
				// Save the logged-in username in the session
				req.session.username = username;
				req.session.save(function () {
					res.send(
						"<p>You have logged in successfully</p>" +
							'<p><a href="/profile">Go to your profile</a></p>'
					);
				});
			}
		}
	});
});

/*
  /profile — another page that reads the session.
  Shows the username stored at login. If there is no session, ask them to log in.
*/
app.get("/profile", function (req, res) {
	if (!req.session.username) {
		res.send(
			"<p>You are not logged in.</p>" +
				'<p><a href="login.html">Login</a> here</p>'
		);
		return;
	}

	res.send(
		"<h2>Profile</h2>" +
			"<p>Welcome, <strong>" +
			req.session.username +
			"</strong>!</p>" +
			"<p>Your username is stored in the session.</p>" +
			'<p><a href="/logout">Logout</a></p>'
	);
});

/*
  /logout — destroy the session when the user clicks the logout link.
  After destroy, the username is no longer available on /profile.
*/
app.get("/logout", function (req, res) {
	req.session.destroy(function (err) {
		if (err) {
			res.send("Error logging out");
		} else {
			res.send(
				"<p>Logged out successfully!</p>" +
					'<p><a href="login.html">Login</a> here</p>'
			);
		}
	});
});

app.listen(PORT, function () {
	console.log("Server listening on http://localhost:" + PORT);
});
