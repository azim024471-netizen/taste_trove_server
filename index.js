const express = require('express');
const app = express()
app.use(express.json())


const cors = require('cors')
app.use(cors())

const dotenv = require('dotenv');
dotenv.config();


const port = process.env.PORT






const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const favoritesCollection = db.collection('favorites')


// recipes   api ///////////////////////

app.get('/api/recipes', async (req, res) => {
    const result = await recipeCollection.find().toArray(); 
    res.json(result);
});



app.get('/api/recipes/user/:userId', async (req, res) => {
    const userid = req.params.userId;
    const query = { authorId: userid }; 
    const result = await recipeCollection.find(query).toArray();
    res.json(result);
});



app.get('/api/recipes/:id', async (req, res) => {

  const id = req.params.id;

  const query = {
    _id : new ObjectId(id)
  }

    const result = await recipeCollection.findOne(query);
    res.json(result);
});


 
app.post('/api/recipes' , async(req, res)=>{
    const recipe = req.body

    const recipeData = {
        ...recipe,
        createdAt : new Date()
    }

    const result = await recipeCollection.insertOne(recipeData);
    res.send(result)
})

 



app.patch('/api/recipes/:id', async (req, res) => {  

  const id = req.params.id

  const reqData = req.body

   const updateData ={
    ...reqData ,
     updatedAt: new Date(),
  }

   const query = {_id : new ObjectId(id)}

   
 const result = await recipeCollection.updateOne(query, {$set : updateData});
 res.json(result)

})



app.delete('/api/recipes/:id', async(req, res)=>{
  const id = req.params.id;
const filter = { _id: new ObjectId(id) };

  const result = await recipeCollection.deleteOne(filter);
  res.json(result)
})




    // api for favorites //////////////////////////
  
    app.get('/api/myFavorites/:userid', async(req, res)=>{
    const userid = req.params.userId;
    const query = { authorId: userid }; 
    const result = await favoritesCollection.find(query).toArray();
    res.json(result);

    }
  )

    app.post('/api/favorites', async (req, res) => {
  const favoriteRecipe = req.body; 

  const query = { 
    userId: favoriteRecipe.userId, 
    recipeId: favoriteRecipe.recipeId 
  };


  const alreadyExists = await favoritesCollection.findOne(query);

  if (alreadyExists) {
    return res.status(400).send({ 
      success: false, 
      message: "This recipe is already in your favorites!" 
    });
  }

  const result = await favoritesCollection.insertOne(favoriteRecipe);
  res.send({ success: true, result });
});











  // extras ///////////////////





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    console.log('everything is oky')
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Welcome to  Taste Trove!')
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})