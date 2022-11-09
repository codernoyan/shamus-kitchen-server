const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ufdxsbo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const dbConnect = async () => {
  try {
    await client.connect();
    console.log('MongoDB Connected');
  } catch (error) {
    console.log(error.name, error.message);
  }
}
dbConnect();

// kitchen service database
const servicesCollection = client.db('cloudKitchen').collection('services');

// add services
app.post('/services', async (req, res) => {
  try {
    const service = req.body;
    const result = await servicesCollection.insertOne(service);
    console.log(result);
    if (result.insertedId) {
      res.send({
        success: true,
        message: `Successfully created ${service.name} service`,
        data: result
      })
    } else {
      res.send({
        success: false,
        error: "Couldn't create your requested service"
      })
    }

  } catch (error) {
    res.send({
      success: false,
      error: error.message
    })
  }
});

// get services
app.get('/services', async (req, res) => {
  try {
    const query = {};
    const cursor = servicesCollection.find(query);
    const size = parseInt(req.query.size);

    if (size) {
      const services = await cursor.limit(size).toArray();
      res.send({
        success: true,
        message: 'Successfully got the services data',
        data: services
      })
    } else {
      const services = await cursor.toArray();
      res.send({
        success: true,
        message: 'Successfully got the services data',
        data: services
      })
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message
    });
  }
});

// get single service
app.get('/services/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await servicesCollection.findOne(query);

    res.send({
      success: true,
      message: 'Successfully got the requested data',
      data: result
    })
  } catch (error) {
    res.send({
      success: false,
      error: error.message
    });
  }
});

// review post api
app.put('/services/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const info = req.body;
    const updatedDoc = {
      $push: { customerReview: info }
    };
    const result = await servicesCollection.updateOne(filter, updatedDoc, { upsert: true });

    if (result.matchedCount) {
      res.send({
        success: true,
        message: `successfully updated review`,
        data: result
      });
    } else {
      res.send({
        success: false,
        error: "Couldn't update  the product",
      });
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message
    });
  }
})

app.get('/', (req, res) => {
  res.send('Cloud Kitchen server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
})
