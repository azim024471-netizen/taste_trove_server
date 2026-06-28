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
    const purchasedCollection = db.collection('purchased')
    const reportsCollection = db.collection('reports')

    const usersCollection = db.collection('user')
    const paymentsCollection = db.collection('payments')



    // recipes   api ///////////////////////

 app.get('/api/recipes/all', async (req, res) => {
  
    const recipes = await recipeCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    res.send({
        recipes
    })
  
});


    app.get('/api/recipes', async (req, res) => {
      try {
        const { search, category, cuisine, servings, page } = req.query;
        const perPage = 9;

        let query = {};

        if (search) {
          query.recipeName = { $regex: search, $options: 'i' };
        }

        if (category) {
          query.category = category;
        }

        if (cuisine) {
          query.cuisineType = cuisine;
        }

        if (servings) {
          query.servings = servings;
        }



        const currentPage = Number(page) || 1;
        const skipItems = (currentPage - 1) * perPage;


        const totalRecipes = await recipeCollection.countDocuments(query);

        const recipes = await recipeCollection.find(query).sort({ createdAt: -1 }).skip(skipItems).limit(perPage).toArray();

        const totalPages = Math.ceil(totalRecipes / perPage)


        res.json({ recipes, totalPages, totalRecipes, currentPage });

      } catch (error) {
        console.error("Error fetching recipes:", error);
        res.status(500).json({ error: "Server error" });
      }
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
        _id: new ObjectId(id)
      }

      const result = await recipeCollection.findOne(query);
      res.json(result);
    });



   






    app.post('/api/recipes', async (req, res) => {
      const recipe = req.body

      const recipeData = {
        ...recipe,
        createdAt: new Date()
      }

      const result = await recipeCollection.insertOne(recipeData);
      res.send(result)
    })





    app.patch('/api/recipes/:id', async (req, res) => {

      const id = req.params.id

      const reqData = req.body

      const updateData = {
        ...reqData,
        updatedAt: new Date(),
      }

      const query = { _id: new ObjectId(id) }


      const result = await recipeCollection.updateOne(query, { $set: updateData });
      res.json(result)

    })



    app.delete('/api/recipes/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const result = await recipeCollection.deleteOne(filter);
      res.json(result)
    })




    // api for favorites //////////////////////////

    app.get('/api/myFavorites/:userid', async (req, res) => {
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



    app.delete('/api/myFavorites/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) };
      const result = await favoritesCollection.deleteOne(filter)
      res.send(result)

    })




    // purched api /////////////////////

    app.get('/api/purchased/:userId', async (req, res) => {

      const id = req.params.userId;
      const query = { userId: id };

      const result = await purchasedCollection.find(query).toArray();

      res.send({
        success: true,
        count: result.length,
        data: result
      });

    });







    app.post('/api/purchased', async (req, res) => {
      const purchasedRecipe = req.body;
      const query = {
        userId: purchasedRecipe.userId,
        recipeId: purchasedRecipe.recipeId
      };

      newPurchasedPecipe = {
        ...purchasedRecipe,
        purchasedAt: new Date(),
      }

      const result = await purchasedCollection.insertOne(newPurchasedPecipe);
      res.send({ success: true, result });
    });



    // upgrade user type /////////////////////

    app.patch('/api/users/upgrade-premium/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const { planType } = req.body;

        if (!userId || userId === 'undefined') {
          return res.status(400).json({ success: false, message: 'User ID is missing' });
        }
        const query = { _id: new ObjectId(userId) };

        const result = await usersCollection.updateOne(
          query,
          {
            $set: {
              user_type: planType,
              updatedAt: new Date()
            }
          }
        );


        if (result.matchedCount === 0) {
          return res.status(404).json({ success: false, message: 'User not found in database!' });
        }
        res.json({ success: true, message: 'User upgraded successfully', result });

      } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to upgrade' });
      }
    });





    // ──   transactions////////////////////////////////////

    app.post('/api/payments', async (req, res) => {
      try {
        const payment = req.body;
        const result = await paymentsCollection.insertOne({
          ...payment,
          paidAt: new Date(),
        });
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save payment' });
      }
    });



   app.get('/api/payments', async (req, res) => {
  try {
    const result = await paymentsCollection.find().sort({ paidAt: -1 }).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

  // api for count //////////
  

app.get('/api/admin/count-info', async (req, res) => {
    try {
           const totalReports= await reportsCollection.countDocuments({})
           const totalRecipes =await recipeCollection.countDocuments({})
           const totalUsers = await usersCollection.countDocuments({})
          const totalPremium = await  usersCollection.countDocuments({ 
                user_type: { $in: ['elite', 'standard'] } 
            })
        
        res.json({
            success: true,
            data: {
                totalReports,
                totalRecipes,
                totalUsers,
                totalPremiumMembers: totalPremium
            }
        });

    } catch (error) {
        console.error("Error fetching count info:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch dashboard count information" 
        });
    }
});



app.get('/api/user/dashboard-stats/:userID', async (req, res) => {
  const userID = req.params.userID;

  try {
    const recipes = await recipeCollection.find({ authorId: userID }).toArray();
    
    const favoritesCount = await favoritesCollection.countDocuments({ userId: userID });

    const totalRecipes = recipes.length;
    const totalLikesReceived = recipes.reduce((sum, recipe) => sum + (recipe.likesCount || 0), 0);

    res.json({
      totalRecipes,
      totalFavorites: favoritesCount,
      totalLikesReceived
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: "Stats not found" });
  }
});






    // reports api /////////////////////////////////////////////////////////


    app.post('/api/reports', async (req, res) => {
      const reportsRecipe = req.body;

      const query = {
        userId: reportsRecipe.userId,
        recipeId: reportsRecipe.recipeId
      };


      const alreadyExists = await reportsCollection.findOne(query);

      if (alreadyExists) {
        return res.status(400).send({
          success: false,
          message: "You have already reported this recipe."
        });
      }

      const result = await reportsCollection.insertOne(reportsRecipe);
      res.send({ success: true, result });
    });



    app.get('/api/reports', async (req, res) => {
      try {
        const reports = await reportsCollection.find().sort({ reportedAt: -1 }).toArray();

        res.send(reports);
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: 'Failed to fetch reports',
        });
      }
    });




    app.delete('/api/reports/remove-recipe/:reportId/:recipeId', async (req, res) => {
      try {
        const { reportId, recipeId } = req.params;

        const reportDeleteResult = await reportsCollection.deleteOne({
          _id: new ObjectId(reportId)
        });

        const recipeDeleteResult = await recipeCollection.deleteOne({
          _id: new ObjectId(recipeId)
        });


        if (reportDeleteResult.deletedCount === 0 && recipeDeleteResult.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Report or Recipe not found in database."
          });
        }

        res.send({
          success: true,
          message: "Report and Recipe successfully deleted."
        });

      } catch (error) {
        console.error("Error deleting report and recipe:", error);
        res.status(500).send({
          success: false,
          message: "Internal server error failed to delete."
        });
      }
    });


    app.delete('/api/reports/:reportId', async (req, res) => {

      const { reportId } = req.params;

      const result = await reportsCollection.deleteOne({
        _id: new ObjectId(reportId)
      });


      if (result.deletedCount === 0) {
        return res.status(404).send({
          success: false,
          message: "Report not found in database."
        });
      }


      res.send({
        success: true,
        message: "Report dismissed successfully."
      });


    });






    // feature api //////////////////


    app.patch('/api/recipes/feature/:id', async (req, res) => {
      const id = req.params.id;
      const { isFeatured } = req.body;
      const query = { _id: new ObjectId(id) }



      const result = await recipeCollection.updateOne(
        query,
        { $set: { isFeatured: isFeatured  ,  updatedAt: new Date() } }
      );

      res.json(result);
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