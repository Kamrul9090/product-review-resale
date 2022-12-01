const express = require("express");
const cors = require("cors");
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();

app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER_}:${process.env.DB_PASSWORD_}@cluster0.zvviljv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.CRYPTO_SECRET_KEY, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const categoriesCollections = client.db('WatchesData').collection('watchCategories');
        const watchDataCollections = client.db('WatchesData').collection('categoryData');
        const bookingCollections = client.db('WatchesData').collection('bookings');
        const usersCollections = client.db('WatchesData').collection('users');
        const productsCollections = client.db('WatchesData').collection('products');

        app.get('/categories', async (req, res) => {
            const query = {};
            const result = await categoriesCollections.find(query).toArray();
            res.send(result)
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollections.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.CRYPTO_SECRET_KEY, { expiresIn: '1d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        })

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await categoriesCollections.findOne(query);
            res.send(result)
        })


        app.get('/categoryWatchData', verifyJWT, async (req, res) => {
            const index = req.query.index;
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const filter = { index: index }
            const result = await watchDataCollections.find(filter).toArray();
            const matchData = result[0].category;
            res.send(matchData);
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
            console.log(alreadyBooked);
            if (alreadyBooked.length) {
                return res.send({ acknowledged: false, message: 'This item already booked' })
            }
            const result = await bookingCollections.insertOne(booking);
            res.send(result)
        })



        app.get('/users', verifyJWT, async (req, res) => {
            const query = {};
            const data = await usersCollections.find(query).toArray();
            res.send(data);
        })
        app.delete('/users/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const data = await usersCollections.deleteOne(query);
            res.send(data);
        })
        app.get('/allBuyers', verifyJWT, async (req, res) => {
            const query = {}
            const users = await usersCollections.find(query).toArray();
            const buyer = users.filter(user => user.select === 'Buyer' && user.role !== 'admin');
            res.send(buyer)
        })

        app.get('/allSellers', verifyJWT, async (req, res) => {
            const query = {}
            const users = await usersCollections.find(query).toArray();
            const seller = users.filter(user => user.select === 'Seller' && user.role !== 'admin');
            res.send(seller)
        })

        app.get('/products', async (req, res) => {
            const query = {}
            // const query = req.query.email;
            const data = await productsCollections.find(query).toArray();
            res.send(data);
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const data = await productsCollections.findOne(filter);
            res.send(data);
        })

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const data = await productsCollections.deleteOne(filter);
            res.send(data);
        })

        app.post('/users', async (req, res) => {
            const userData = req.body;
            const result = await usersCollections.insertOne(userData);
            res.send(result)
        })

        app.post('/addProducts', async (req, res) => {
            const productsData = req.body;
            const data = await productsCollections.insertOne(productsData);
            res.send(data);
        })

        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollections.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const adminUser = await usersCollections.findOne(query);
            if (adminUser?.role !== 'admin') {
                return res.status(403).send('forbidden access')
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    role: 'admin',
                }
            }
            const user = await usersCollections.updateOne(filter, updateDoc, options);
            res.send(user);
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

