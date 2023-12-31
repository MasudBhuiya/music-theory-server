const express = require('express');
require('dotenv').config();
const cors = require('cors');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000;


// middleware
app.use(cors())
app.use(express.json());


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
    // await client.connect();


    const classCollection = client.db('summerDb').collection('class');
    const instructorCollection = client.db('summerDb').collection('instructors');
    const usersClassCollection = client.db('summerDb').collection('usersclass');
    const usersCollection = client.db('summerDb').collection('users');

    

    //users related apis
    app.get('/users', async(req, res)=> {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    app.get('/roleusers', async(req, res)=>{
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await usersCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/users', async(req, res)=>{
      const user = req.body;
      const query = {email: user.email}
      const existingUser = await usersClassCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exists'})
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    });

    //create Instructor
    app.patch('/users/instructor/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'instructor'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    //create admin
    app.patch('/users/admin/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
    })


    app.delete('/users/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await usersCollection.deleteOne(query);
      res.send(result)
     })

     //all classes
    app.get('/class', async(req, res)=>{
      const query = {}
      const options = {
        sort: { "enroll": -1 }
      };
      const result = await classCollection.find(query, options).toArray();
      res.send(result)
    })

    app.post('/class', async(req, res)=>{
      const usersdata = req.body;
      console.log(req.body)
      const result = await classCollection.insertOne(usersdata);
      res.send(result)
    });

//-----------------------------
    app.get('/singleclass/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      console.log({query})
      const result = await classCollection.findOne(query);
      console.log({result})
      res.send(result);
    });
//-----------------------------

    app.put('/class/:id', async(req, res)=>{
      const id = req.params.id;
      const update = req.body;
      // console.log(update)
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const classes = {
        $set: {
          status: update.status,
          enroll: parseFloat(update.enroll),
          availableSeats: parseFloat(update.availableSeats),
        }
      }
      const result = await classCollection.updateOne(filter, classes, options);
      res.send(result)
    });



    //post my data by email
    app.post('/usersclass', async(req, res)=>{
      const usersdata = req.body;
      console.log(req.body)
      const result = await usersClassCollection.insertOne(usersdata);
      res.send(result)
    });

    app.get('/usersclass', async(req, res)=>{
      const result = await usersClassCollection.find().toArray();
      res.send(result)
    })
 
    // get my data by email
    app.get('/myclasses', async(req, res)=>{
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await usersClassCollection.find(query).toArray();
      res.send(result)
    })

//     //delete my class
   app.delete('/usersclass/:id', async(req, res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await usersClassCollection.deleteOne(query);
    res.send(result)
   })



    //instructors
    app.get('/instructors', async(req, res)=>{
      const result = await instructorCollection.find().toArray();
      res.send(result)
    })

    app.get('/myaddedclass', async(req, res)=>{
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await classCollection.find(query).toArray();
      res.send(result)
    })


    app.get('/instructors/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await classCollection.findOne(query);
      res.send(result);
    });

    app.put('/instructors/:id', async(req, res)=>{
      const id = req.params.id;
      const update  = req.body;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const classes = {
        $set: {
          price: update.price,
          name: update.name,
          image: update.image,
          totalSeats: update.totalSeats
        }
      }
      const result = await classCollection.updateOne(filter, classes, options);
      res.send(result)
    })



    app.post('/instructors', async(req, res)=>{
      const usersdata = req.body;
      console.log(req.body)
      const result = await instructorCollection.insertOne(usersdata);
      res.send(result)
    });


    //---------------------------------
    //create payment intent
    app.post('create-payment-intent', async(req, res)=>{
      const {price} = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
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
    res.send('Summer camps')
  })

app.listen(port, () => {
    console.log(`Summer camp is running on port ${port}`)
  })


