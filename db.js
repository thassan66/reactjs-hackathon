const mongoose = require('mongoose')

const url = process.env['DB_CONNECTION'];

const connectionParams={
    useNewUrlParser: true,
    //useCreateIndex: true,
    useUnifiedTopology: true 
}
mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to the database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. n${err}`);
    })