const express = require("express");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const details = require("./seeds")
const PORT = 3001;
console.log(details)
const keys = Object.keys(details)
let MB_SITE_URL = "your_metabase_site_url";
let MB_EMBEDDING_SECRET_KEY = "Your secret key";
let DASHBOARD_ID=0 ;
function checkAuth(req, res, next) {
    const userId = req.session.userId;
    if(userId) {
        return next();
    }
    req.session.redirectTo = req.path;
    return res.redirect('/login');
}
if (!MB_EMBEDDING_SECRET_KEY) {
  throw new Error("Please set MB_EMBEDDING_SECRET_KEY.");
}
if (typeof DASHBOARD_ID !== "number" || isNaN(DASHBOARD_ID)) {
  throw new Error("Please set DASHBOARD_ID.");
}
console.log(keys)
const app = express();

app.set("view engine", "ejs");
app.use(session({ secret: "FIXME", resave: false, saveUninitialized: true }));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.render("index"));


app.route("/login")
    .get((req, res) => {
      res.render("login")
    })
    .post((req, res) => {
      const { username, password } = req.body;
      for(let i=0;i<keys.length;i++){
        const keyValue = keys[i]
        if(details[keyValue].includes(username)){
          req.session.userId = 1;
          DASHBOARD_ID = parseInt(keyValue,10)
          console.log(DASHBOARD_ID)
          res.redirect('/signed_dashboard/1');
        }
        else{
          continue
        }
      }
    });
app.get("/logout", (req, res) => {
    delete req.session.userId;
    res.redirect("/");
});

// authenticated routes

app.get("/signed_chart/:id", checkAuth, (req, res) => {
  const chartId = req.params.id
  const unsignedToken = {
      resource: { question: parseInt(chartId,10) },
      params: { },
      exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
  };
  const signedToken = jwt.sign(unsignedToken, MB_EMBEDDING_SECRET_KEY);
  const iframeUrl = `${MB_SITE_URL}/embed/question/${signedToken}`;
  res.render("chart", { userId: req.session.id, iframeUrl: iframeUrl , chartId:unsignedToken.resource.question});
})
app.get("/signed_dashboard/:id", checkAuth, (req, res) => {
  try {
    const unsignedToken = {
        resource: { dashboard: DASHBOARD_ID },
        params: {},
        exp: Math.round(Date.now() / 1000) + (10 * 60) 
    };
    console.log(unsignedToken)
    const signedToken = jwt.sign(unsignedToken, MB_EMBEDDING_SECRET_KEY);
    console.log("ST:",signedToken)
    const iframeUrl = `${MB_SITE_URL}/embed/dashboard/${signedToken}`;
    console.log("IF:",iframeUrl)
    res.render("dashboard", { userId: req.session.id, iframeUrl: iframeUrl, dashboardId: DASHBOARD_ID }); 
  } catch (error) {
    console.log(error)
  }
   
})



app.listen(PORT, () => {
  console.log(" app listening on port " + PORT + "!");
});
