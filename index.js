const express = require("express");
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();

app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER_}:${process.env.DB_PASSWORD_}@cluster0.zvviljv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const categoriesCollections = client.db('WatchesData').collection('watchCategories');

        app.get('/categories', async (req, res) => {
            const query = {};
            const result = await categoriesCollections.find(query).toArray();
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

