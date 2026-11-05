const express = require("express");
const app = express();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const PORT = 3000;

app.use(cookieParser());

app.use(session({
  secret: 'your-secure-secret-key', // Used to sign the session ID cookie
  resave: false,                    // Prevents resaving unchanged sessions
  saveUninitialized: false,         // Prevents storing empty, uninitialized sessions
  cookie: { 
    maxAge: 60000 * 60,             // Cookie expiry in milliseconds (1 hour)
    httpOnly: true,                 // Protects against XSS attacks
    secure: false                   // Set to true if using HTTPS
  }
}));


const user = {
    name: "Dave",
    zip_code: 30311,
    Address: "Atlanta"
};

app.get("/login", (req, res) => {
    req.session.user = user;
    req.session.save();
    return res.send("You are are logged in");
});

app.get("/user", (req, res) => {
    const sessionuser = req.session.user;
    res.send(sessionuser);
});

app.get("/logout", (req, res) => 
{
    req.session.destroy((err)=> 
	{
		if (err) res.send("Error logging out");
		else res.send('Logged out successfully!');
	});
    
});

app.listen(PORT, () => console.log(`Server at ${PORT}`));