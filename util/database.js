const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

const mongoConnect = callback => {
  MongoClient.connect('mongodb+srv://archie00:FQVKwBFEVrspxBfc@cluster0.t9sz7p7.mongodb.net/expenseDb')
    .then(client => {
      console.log('Connected!');

    })
    .catch(err => {
      console.log(err);
      throw err;
    });
};

module.exports = mongoConnect;