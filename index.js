const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const colors = require('colors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// mongodb

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const dbConnect = async () => {
  try {
    await client.connect();
    console.log('MongoDB Connected'.yellow.bold);
  } catch (error) {
    console.log(error.name, error.message);
  }
}
dbConnect();

app.get('/', (req, res) => {
  res.send('Cloud Kitchen server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`.cyan.bold);
})
