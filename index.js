const express = require('express');
const app = express()
app.use(express.json())


const cors = require('cors')
app.use(cors())

const dotenv = require('dotenv');
dotenv.config();


const port = process.env.PORT






const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_DB_URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
        
    const db = client.db('Taste_Trove');
    const recipeCollection = db.collection('recipes')


// recipes   api ///////////////////////











  



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Welcome to  Taste Trove!')
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})