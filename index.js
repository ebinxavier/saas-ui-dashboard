const express = require("express"); // https://www.npmjs.com/package/express
const session = require("express-session"); // https://www.npmjs.com/package/express-session
const passport = require("passport"); // https://www.npmjs.com/package/passport
const WebAppStrategy = require("ibmcloud-appid").WebAppStrategy; // https://www.npmjs.com/package/ibmcloud-appid
const jwt_decode = require("jwt-decode");

const app = express();

// Warning The default server-side session storage implementation, MemoryStore,
// is purposely not designed for a production environment. It will
// leak memory under most conditions, it does not scale past a single process,
// and is meant for debugging and developing.
// For a list of stores, see compatible session stores below
// https://www.npmjs.com/package/express-session#compatible-session-stores
app.use(
  session({
    secret: "123456",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

passport.use(
  new WebAppStrategy({
    tenantId: "f8e78439-5478-4281-ade4-36aa0a7b0bec",
    clientId: "251e24cc-968c-4569-83be-196e15e1f85c",
    secret: "ZWIyODRiNTUtNWU0Zi00MjM2LWFhMmYtZWIzZjVmMzc3ZmMw",
    oauthServerUrl:
      "https://us-south.appid.test.cloud.ibm.com/oauth/v4/f8e78439-5478-4281-ade4-36aa0a7b0bec",
    redirectUri: "https://saas-ui-dashboard.vercel.app/appid/callback",
  })
);

// Handle Login
app.get(
  "/appid/login",
  passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
    successRedirect: "/",
    forceLogin: true,
  })
);

// Handle callback
app.get("/appid/callback", passport.authenticate(WebAppStrategy.STRATEGY_NAME));

// Handle logout
app.get("/appid/logout", function (req, res) {
  WebAppStrategy.logout(req);
  res.redirect("/");
});

// Protect the whole app
// app.use(passport.authenticate(WebAppStrategy.STRATEGY_NAME));

// Make sure only requests from an authenticated browser session can reach /api
app.use("/api", (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
});

// The /api/user API used to retrieve name of a currently logged in user
app.get("/api/user", (req, res) => {
  // console.log(req.session[WebAppStrategy.AUTH_CONTEXT]);
  console.log(req);
  res.json({
    user: {
      name: req.user.name,
    },
  });
});

// Serve static resources
app.use(express.static("./public"));

app.get(
  "/test",
  passport.authenticate(WebAppStrategy.STRATEGY_NAME),
  (req, res) => {
    var token = req.session.APPID_AUTH_CONTEXT.accessToken;
    var decoded = jwt_decode(token);
    const isAdmin = decoded.roles.includes("admin");
    if (isAdmin) {
      res.send("<h1>Welcome, You are allowed to view this App.</h1>");
    } else {
      res.send("<h1>Please ask admin for accessing the App</h1>");
    }
  }
);

// Start server
// const port = process.env.PORT;
// app.listen(port, () => {
//   console.log(`Listening on ${port}`);
// });

module.exports = app;
