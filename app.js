const express = require('express');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'chama-yetu-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set true with HTTPS in production
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes (we'll create these files next)
app.use('/', require('./routes/dashboard'));
app.use('/auth', require('./routes/auth'));
app.use('/members', require('./routes/members'));
app.use('/contributions', require('./routes/contributions'));
app.use('/loans', require('./routes/loans'));
app.use('/meetings', require('./routes/meetings'));

// Initialize DB
const db = require('./db/database');
db.init();

app.listen(PORT, () => {
  console.log(`🌐 Chama Yetu running on http://localhost:${PORT}`);
});
