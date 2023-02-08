const express  = require('express');
const path = require('path');
const fs = require('fs');

const morgan = require('morgan');
const compression = require('compression');
const app = express();
const body_parser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');

// const User = require('./models/user');
// const Expense = require('./models/expense');
// const PremiumUser = require('./models/premium-user');
// const Forgotpassword = require('./models/forgot-password');
// const Download = require('./models/download');

// User.hasMany(Expense);
// Expense.belongsTo(User);

// User.hasOne(PremiumUser);
// PremiumUser.belongsTo(User);

// User.hasMany(Forgotpassword);
// Forgotpassword.belongsTo(User);

// User.hasMany(Download);
// Download.belongsTo(User);

const userRoutes = require('./routes/user');
const expenseRoutes = require('./routes/expense');
const passwordRoutes = require('./routes/password');


// const data_base = require('./util/database');

const cors = require('cors');

app.use(body_parser.json());
app.use(cors());

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    {flags: 'a'}
);

// const certificate = fs.readFileSync('server.cert');
// const privateKey = fs.readFileSync('server.key');

// app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream}));

app.use('/user', userRoutes);
app.use('/expense', expenseRoutes);
app.use('/password', passwordRoutes);

app.use((req, res) => {
    // console.log('url-------->', req.url);
    
    res.sendFile(path.join(__dirname, `public/views/${req.url}`));
})

// console.log(process.env.NODE_ENV);

// data_base.sync({force: true})
mongoose.connect(`mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.t9sz7p7.mongodb.net/expenseDb`)
    .then(() => {
        // https.createServer({key: privateKey, cert: certificate}, app)
        //     .listen(process.env.PORT || 4000);
        app.listen(process.env.PORT);
    })
    .catch(err => console.log(err));
