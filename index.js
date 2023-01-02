const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// jwt middleware
const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).send({ access: 'forbidden' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.AUTH_SECRET_KEY, (err, decoded) => {

    if (err) {
      return res.status(403).send({ access: 'forbidden access' });
    }

    req.decoded = decoded;
    next();
  })
}

// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ufdxsbo.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const client = new MongoClient(uri, { useUnifiedTopology: true}, { useNewUrlParser: true }, {serverApi: ServerApiVersion.v1}, { connectTimeoutMS: 30000 }, { keepAlive: 1});

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
const reviewsCollection = client.db('cloudKitchen').collection('reviews');
const usersCollection = client.db('cloudKitchen').collection('users');

// create a user with jwt token
app.put('/users/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = req.body;
    const query = { email };
    const options = { upsert: true };
    
    const updateDoc = {
      $set: user
    }
    const result = await usersCollection.updateOne(query, updateDoc, options);

    // create jwt token
    const token = jwt.sign({ user }, process.env.AUTH_SECRET_KEY, {
      expiresIn: '1d'
    });

    // console.log(token);

    res.send({ result, token });

  } catch (error) {
    res.send({
      success: false,
      error: error.message
    });
  }
});

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

// post reviews
app.post('/reviews', async (req, res) => {
  try {
    const review = req.body;
    const result = await reviewsCollection.insertOne(review);
    if (result.insertedId) {
      res.send({
        success: true,
        message: `Successfully posted the review`,
        data: result
      })
    } else {
      res.send({
        success: false,
        error: "Couldn't post the review"
      })
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message
    });
  }
})

// get reviews
app.get('/reviews', verifyJwt, async (req, res) => {
  try {
    let query = {};
    const options = {
      sort: { "postedOn": -1 }
    }
    const cursor = reviewsCollection.find(query, options);
    const reviews = await cursor.toArray();
    res.send(reviews);
  } catch (error) {
    res.send({
      success: false,
      error: error.message
    });
  }
});

// removed jwt for prevent errors
app.get('/customer/reviews', verifyJwt, async (req, res) => {
  try {
    const query = req.query.email;
    const filter = { authorEmail: query };
    const cursor = reviewsCollection.find(filter);
    const reviews = await cursor.toArray();
    // console.log(req.headers.authorization);
    res.send(reviews);

  } catch (error) {
    res.send({
      success: false,
      error: error.message
    })
  }
})

app.get('/reviews/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await reviewsCollection.findOne(query);

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
})

// delete review
app.delete('/reviews/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await reviewsCollection.deleteOne(query);

    if (result.deletedCount) {
      res.send({
        success: true,
        message: 'Successfully deleted the review',
        deleted: result
      })
    } else {
      res.send({
        success: false,
        error: "Couldn't delete the review"
      })
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message
    });
  }
});

// update reviews
app.patch('/reviews/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const review = req.body;
    const updatedReview = {
      $set: {
        reviewText: review.reviewText
      }
    };
    const result = await reviewsCollection.updateOne(filter, updatedReview);
    res.send({
      success: true,
      message: 'Review Updated',
      updated: result
    })
  } catch (error) {
    res.send({
      success: false,
      error: error.message
    });
  }
});


app.get('/', (req, res) => {
  res.send('Cloud Kitchen server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
})
