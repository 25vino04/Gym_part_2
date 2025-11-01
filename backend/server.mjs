import express from "express";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";

import { requireAuth, requireAdmin } from "./middleware/auth.mjs";

import { AdminController } from "./controllers/AdminController.mjs";
import { AuthController } from "./controllers/AuthController.mjs";
import { UserController } from "./controllers/UserController.mjs";
import { LocationController } from "./controllers/LocationController.mjs";
import { ActivityController } from "./controllers/ActivityController.mjs";
import { SessionController } from "./controllers/SessionController.mjs";
import { BookingController } from "./controllers/BookingController.mjs";
import { PostController } from "./controllers/PostController.mjs";
import { BlogController } from "./controllers/BlogController.mjs";
import { TimetableController } from "./controllers/TimetableController.mjs";
import { MemberController } from "./controllers/MemberController.mjs";
import { TrainerController } from "./controllers/TrainerController.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;


app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(express.static(path.join(__dirname, "public")));

/* session */
app.use(session({
  secret: "gym-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24
  }
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});


app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.error = null;
  res.locals.success = null;
  next();
});



app.use("/", AuthController.routes);


app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/membership", (req, res) => {
  res.render("membership");
});


app.use("/", BlogController.routes);
app.use("/", TimetableController.routes);


app.use("/member-dashboard", requireAuth);
app.use("/trainer-dashboard", requireAuth);

app.use("/sessions", requireAuth, requireAdmin);
app.use("/bookings", requireAuth, requireAdmin);
app.use("/activities", requireAuth, requireAdmin);
app.use("/locations", requireAuth, requireAdmin);
app.use("/posts", requireAuth, requireAdmin);


app.use("/", MemberController.routes);
app.use("/", TrainerController.routes);
app.use("/", AdminController.routes);
app.use("/users", UserController.routes);
app.use("/locations", LocationController.routes);
app.use("/activities", ActivityController.routes);
app.use("/sessions", SessionController.routes);
app.use("/bookings", BookingController.routes);
app.use("/posts", PostController.routes);


app.listen(port, () => {
  console.log("Backend started on http://localhost:" + port);
});