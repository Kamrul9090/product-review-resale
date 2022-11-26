const express = require("express");
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();

app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER_}:${process.env.DB_PASSWORD_}@cluster0.zvviljv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const categoriesCollections = client.db('WatchesData').collection('watchCategories');
        const watchDataCollections = client.db('WatchesData').collection('categoryData');
        const bookingCollections = client.db('WatchesData').collection('bookings');
        const usersCollections = client.db('WatchesData').collection('users');
        app.get('/categories', async (req, res) => {
            const query = {};
            const result = await categoriesCollections.find(query).toArray();
            res.send(result)
        })

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await categoriesCollections.findOne(query);
            res.send(result)
        })

        app.get('/categoryWatchData', async (req, res) => {
            const index = req.query.index;
            const filter = { index: index }
            const result = await watchDataCollections.find(filter).toArray();
            res.send(result);
        })

        app.get('/bookings', async (req, res) => {
            const query = {};
            const data = await bookingCollections.find(query).toArray();
            res.send(data)
        })
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const doc = {
                name: booking.name,
                email: booking.email,
            }

            const alreadyBooked = await bookingCollections.find(doc).toArray();

            if (alreadyBooked.length) {
                return res.send({ acknowledged: false, message: 'This item already booked' })
            }
            const result = await bookingCollections.insertOne(booking);
            res.send(result)
        })



    } finally {

    }
}
run().catch(e => console.error(e))


app.get('/', (req, res) => {
    res.send('server running')
});


app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})

