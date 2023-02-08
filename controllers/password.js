const Forgotpassword = require('../models/forgot-password');
const User = require('../models/user');
const Sib = require('sib-api-v3-sdk');
require('dotenv').config();
const uuid = require('uuid');
const bcrypt = require('bcrypt');

exports.forgotPassword = async (req, res) => {
    try {
        const email = req.body.email;

        const user = await User.findOne({ email: email });

        if(user){
            // const id = uuid.v4();
            let newRequest = await Forgotpassword.create({ active: true, userId: user });
            
            const client = Sib.ApiClient.instance;

            const apiKey = client.authentications['api-key'];
            apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

            const sender = {
                email: 'archiesaha@gmail.com',
                name: 'Archisman Saha- Admin'
            }

            const recivers = [
                {
                    email: 'guitaristarchie@gmail.com'
                }
            ]

            const transactionalEmailApi = new Sib.TransactionalEmailsApi();

            transactionalEmailApi
                .sendTransacEmail({
                    subject: 'Please reset your password via this link',
                    sender,
                    to: recivers,
                    // textContent: `Cules Coding will teach you how to become a {{params.role}} developer.`,
                    htmlContent: `
                        <a href="http://localhost:4000/password/resetpassword/${newRequest._id}">Reset password</a>
                    `
                })
                .then((result) => {
                    console.log(result);
                    return res.status(200).json({success: true, message: 'reset password link has been sent to your email'});
                })
                .catch((error) => {
                    throw new Error(error);
                });
            

            //send mail
        }else {
            
            throw new Error('User doesnt exist');
        }        
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error, sucess: false});
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const id =  req.params.id;
        Forgotpassword.findOne({ _id: id }).then(forgotpasswordrequest => {
            if(forgotpasswordrequest){
                if(forgotpasswordrequest.active === true) {
                    forgotpasswordrequest.active = false;
                    forgotpasswordrequest.save().then(() => {

                        res.status(200).send(`<html>
                                                <script>
                                                    function formsubmitted(e){
                                                        e.preventDefault();
                                                        console.log('called')
                                                    }
                                                </script>
                                                <form action="http://localhost:4000/password/updatepassword/${id}" method="get">
                                                    <label for="newpassword">Enter New password</label>
                                                    <input name="newpassword" type="password" required></input>
                                                    <button>reset password</button>
                                                </form>
                                            </html>`
                                            )
                    })
                }
                else {
                    throw new Error('request has expired');
                }
            } else {
                throw new Error('request not found');
            }
        })
        
    } catch (error) {
        console.log(error);
    }
}

exports.updatePassword = (req, res) => {
    try {
        const { newpassword } = req.query;
        const  resetpasswordid  = req.params.id;
        // console.log('new password------------', newpassword);
        // console.log('resetpassword id---------------', resetpasswordid);
        Forgotpassword.findOne({ _id: resetpasswordid }).then(resetpasswordrequest => {

            User.findOne({ _id : resetpasswordrequest.userId}).then(user => {
                // console.log('userDetails', user)
                if(user) {
                    //encrypt the password

                    const saltRounds = 10;
                    bcrypt.genSalt(saltRounds, function(err, salt) {
                        if(err){
                            console.log(err);
                            throw new Error(err);
                        }
                        bcrypt.hash(newpassword, salt, function(err, hash) {
                            // Store hash in your password DB.
                            if(err){
                                console.log(err);
                                throw new Error(err);
                            }
                            user.update({ password: hash }).then(() => {
                                res.status(201).json({message: 'Successfuly updated the new password'})
                            })
                        });
                    });
                } else{
                    return res.status(404).json({ error: 'No user Exists', success: false})
                }
            })
        })
    } catch(error){
        return res.status(403).json({ error, success: false } )
    }
}