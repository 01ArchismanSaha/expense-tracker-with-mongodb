const User = require('../models/user');
const PremiumUser = require('../models/premium-membership');
const Download = require('../models/download');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { regexpToText } = require('nodemon/lib/utils');
const saltRounds = 10;
const Razorpay = require('razorpay');

exports.addUser = async (req, res, next) => {
    const {name, email, password} = req.body;

    if(name.length > 0 && email.length > 0 && password.length > 0) {
        const user = await User.exists({email: email});
        // console.log(user);
        if(user){
            // console.log(user);
            return res.status(409).json({message: 'User already exists!'});
        }
        bcrypt.hash(password, saltRounds, function(error, hash) {
            // Store hash in your password DB.
            const user = new User({
                name: name, 
                email: email, 
                password: hash,
                isPremiumUser: false,
                latestExpenses: {
                    expenses: [],
                    totalOfMonth: 0
                },
                premimiumMemberships: [],
                forgotPasswordRequests: [],
                downloads: []
            });
            user.save()
                .then(() => {
                    res.status(200).send({success: true, message: 'new user created'});
                })
                .catch(err => {
                    console.log(err);
                    // if(err.name === 'SequelizeUniqueConstraintError'){
                    //     return res.status(400).json({success: false, message: err});
                    // };
                    res.status(500).json({success: false, message: err});
                });
        });
    } else {
        res.status(400).json({success: false, message: 'bad parameters'});
    }
};

exports.logUser = (req, res, next) => {
    const {email, password} = req.body;

    if(email.length > 0 && password.length > 0) {
        User.find({email: email})
            .then(users => {
                // console.log(users);
                const user = users[0];
                if(!user) {
                    return res.status(404).json({success: false, message: 'user does not exist'});
                }

                bcrypt.compare(password, user.password, function(error, result) {
                    if(error) {
                        return res.status(500).json({success: false, message: err});
                    }
                    if(result == true) {
                        const token = jwt.sign({userId: user.id, name: user.name}, 'archie_jwt_secret_key');
                        res.status(200).json({
                            success: true, 
                            message: 'user found',
                            token: token
                        });
                    } else {
                        res.status(401).json({success: false, message: 'password is incorrect'});
                    }
                });
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({success: false, message: err});
            });
    } else {
        res.status(400).json({success: false, message: 'bad parameters'});
    }
};

exports.makePremium = async (req, res, next) => {
    try {
        var instance = new Razorpay({ key_id: process.env.RZP_KEY_ID, key_secret: process.env.RZP_KEY_SECRET });
    
        let order = await instance.orders.create({
          amount: 50000,
          currency: "INR"
        });

        PremiumUser.create({orderId: order.id, status: 'PENDING', userId: req.user})
            .then(() => {

                res.status(201).json({
                    success: true,
                    order, 
                    key_id : instance.key_id,
                    orderStatus: 'pending',
                    message: 'order is created'
                });  
            })
            .catch(err => {
                throw err;
            });
    

    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, error: error});
    }  
};

exports.updateTransactionStatus = async (req, res) => {
    
    try {
        const {order_id, payment_id} = req.body;

        PremiumUser.findOne({orderId: order_id})
            .then(premiumUser => {
                premiumUser.paymentId = payment_id;
                premiumUser.status = 'SUCCESSFUL';
                return premiumUser.save();

            // premiumUser.update({paymentId: payment_id, status: 'SUCCESSFUL'})
            //     .then(() => {
            //         return req.user.update({isPremiumUser: true});
            //     })
            //     .then(() => {
            //         res.status(202).json({success: true, message: 'transaction successful'});
            //     })
            //     .catch(err => {
            //         throw new Error(err);
            //     });
            })
            .then(() => {
                console.log('new premium member added');
                req.user.isPremiumUser = true;
                return req.user.save();
            })
            .then(() => {
                console.log('premium status in user collection updated');
                res.status(202).json({success: true, message: 'transaction successful'});
            })
            .catch(err => {
                throw new Error(err);
            });   
    } catch (error) {
        console.log(error);
        res.status(403).json({success: false, message: 'something went wrong', err: error});
    }
};

exports.checkMembership = (req, res) => {
    if(req.user.isPremiumUser) {
        res.status(200).json({message: 'user has Premium Membership'});
    } else {
        res.status(404).json({message: 'user does not have Premium Membership'});
    }
};


// exports.getExpansion = (req, res) => {
//     if(req.user.isPremiumUser) {
//         const id = req.params.id;

//         User.findByPk(id)
//             .then(user => {
//                 return user.getExpenses();
//             })
//             .then(expenses => {
//                 res.status(200).json({success: true, expenses: expenses});
//             })
//             .catch(err => {
//                 res.status(500).json({success: false, error: err});
//             })
//     } else {
//         res.status(400).json({message: 'user does not have Premium Membership'});
//     }
// }

exports.getDownloads = async (req, res) => {
    if(req.user.isPremiumUser) {
        try {
            const downloads = await Download.find({userId: req.user});
            // console.log(downloads);
            res.status(200).json({downloads: downloads, success: true});
        } catch (error) {
            res.status(500).json({error: error, success: false});
        }
    } else {
        res.status(400).json({message: 'user does not have Premium Membership'});
    }
}