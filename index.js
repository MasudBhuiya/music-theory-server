const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;


// middleware
app.use(cors())
app.use(express.json());


//mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n2defbf.mongodb.net/?retryWrites=true&w=majority`;

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


    const classCollection = client.db('campDB').collection('class');
    const instructorCollection = client.db('campDB').collection('instructor');
    const allClassCollection = client.db('campDB').collection('allClass');

    //classes
    app.get('/classes', async(req, res)=>{
      const query = {}
      const options = {
        sort: { "enroll": -1 }
      };
      const result = await classCollection.find(query, options).toArray();
      res.send(result)
    })
    

   


    //post my data by email
    app.post('/allclasses', async(req, res)=>{
      const allclasses = req.body;
      const result = await allClassCollection.insertOne(allclasses);
      res.send(result)
    })
 
    


    //instructors
    app.get('/instructors', async(req, res)=>{
      const result = await instructorCollection.find().toArray();
      res.send(result)
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Summer camp')
  })

app.listen(port, () => {
    console.log(`Summer camp is running on port ${port}`)
  })