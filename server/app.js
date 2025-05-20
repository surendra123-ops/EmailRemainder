require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const expressLayouts = require("express-ejs-layouts");
const Reminder = require('./models/Reminder'); // ✅ Correct model name

// express instance
const app = express();

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log(err));

// create a transporter for nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.set("layout", "layout");

// routes

// home page
app.get("/", (req, res) => {
    res.render("index", {
        title: "Email Reminder App",
        currentPage: "home",
    });
});

// about page
app.get("/about", (req, res) => {
    res.render("about", {
        title: "About",
        currentPage: "about",
    });
});

// page to show schedule form
app.get("/schedule", (req, res) => {
    res.render("schedule", {
        title: "Schedule Reminder",
        currentPage: "schedule",
    });
});

// actual logic for scheduling the email reminder
app.post("/schedule", async (req, res) => {
    try {
        const { email, message, datetime } = req.body;
        const reminder = new Reminder({
            email,
            message,
            scheduledTime: new Date(datetime),
        });
        await reminder.save();
        res.redirect("/schedule?success=true");
    } catch (error) {
        res.redirect("/schedule?error=true");
    }
});

// getting all reminders
app.get("/reminders", async (req, res) => {
    try {
        const reminders = await Reminder.find().sort({ scheduledTime: 1 });
        res.render("reminders", {
            reminders,
            title: "My Reminders",
            currentPage: "reminders",
        });
    } catch (error) {
        res.redirect("/?error=true");
    }
});

// cron job to send email reminders every minute
cron.schedule("* * * * *", async () => {
    try {
        const now = new Date();
        const reminders = await Reminder.find({
            scheduledTime: { $lte: now },
            sent: false,
        });

        for (const reminder of reminders) {
            await transporter.sendMail({
                from: process.env.EMAIL,
                to: reminder.email,
                subject: "Reminder",
                text: reminder.message,
            });

            reminder.sent = true;
            await reminder.save();
        }
    } catch (error) {
        console.error("Error sending reminders:", error);
    }
});

// start the server
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
