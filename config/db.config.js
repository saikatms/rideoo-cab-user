const mongoose = require('mongoose');
require('./mail.config');

//// Database Connection Start////
mongoose.connect(process.env.URI, { useNewUrlParser: true , useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true }, function (err) {
   if (err) throw err;
   console.log('Mongodb Database Connection Established');
});
//// Database Connection End ////