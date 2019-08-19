const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

mongoose.connect('mongodb://localhost:27017/learning', function(err) {
  if (err) throw err;

  console.log('Successfully connected');
});

app.use(express.json());
app.use(cors());

const Schema = mongoose.Schema;

var schema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  date: { type: Date, default: Date.now },
  posts: [{ body: String, date: Date }]
});

app.get('/', (req, res) => {
  return res.status(200).json('Hello');
});
schema.path('name').index({ unique: true });

var schema2 = Schema({
  post: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'Users', required: true }
});

var schemaInput = new Schema({
  name: { type: String },
  quantity: { type: Number },
  unit_price: { type: Number },
  total_amount: { type: Number },
  transaction: {
    type: String,
    enums: ['Cash', 'Credit'],
    required: true
  },
  date: { type: Date, default: Date.now },
  sales_personnel: { type: String }
});

var schemaFarmer = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  size: { type: Number, required: true, min: 0 },
  location: { type: String, required: true, trim: true },
  inputs: [schemaInput]
});

var User = mongoose.model('Users', schema);
var Post = mongoose.model('Posts', schema2);
var Farmer = mongoose.model('Farmers', schemaFarmer);

app.post('/users', (req, res) => {
  User.create(req.body, function(err, result) {
    if (err) return res.json({ err });
    res.status(200).json({ result });
  });
});

app.post('/users/login', (req, res) => {
  User.find({}, (err, result) => {
    if (err) return res.json({ err });
    res.status(201).json({ result });
  });
});

app.get('/users/:id', (req, res) => {
  const _id = req.params.id;
  User.find({ _id }, (err, result) => {
    if (err) return res.json({ err });
    res.status(200).json({ result });
  });
});

app.delete('/users/:id', (req, res) => {
  const _id = req.params.id;
  User.deleteOne({ _id }, (err, result) => {
    if (err) return res.json({ err });
    if (!result.deletedCount)
      return res.status(404).json('Item does not exist');
    res.status(200).json({ result });
  });
});

app.put('/users/:id', async (req, res) => {
  const _id = req.params.id;
  try {
    const id = await User.findByIdAndUpdate(_id, req.body);
    if (id) {
      const result = await User.find({ _id });
      res.status(200).json({ result });
    }
  } catch (err) {
    return res.json({ err });
  }
});

app.post('/posts', (req, res) => {
  Post.create(req.body, function(err, result) {
    if (err) return res.json({ err });
    res.status(200).json({ result });
  });
});

app.get('/users/:id/posts', async (req, res) => {
  const user = req.params.id;
  try {
    let result = await Post.find({ user }).populate(['user']);
    console.log(result.length);
    const res2 = result.map(post => {
      return { id: post._id, post: post.post };
    });
    const userDetail = result[0].user;
    result = { userDetail, ...res2 };
    res.status(200).json({ ...result });
  } catch (err) {
    return res.json({ err });
  }
});

app.post('/farmers/create', async (req, res) => {
  try {
    const farmer = await Farmer.create(req.body);
    return res.status(201).json({ farmer });
  } catch (err) {
    if (err.code === 11000)
      return res.json({ err: 'Farmer name exists already' });
    return res.json({ err });
  }
});

app.post('/farmers/:id/input', async (req, res) => {
  const _id = req.params.id;
  try {
    // const farmer = await Farmer.findById({ _id });
    // await farmer.inputs.push(req.body);
    // farmer.save();
    const input = await Farmer.update({ _id }, { $push: { inputs: req.body } });
    return res.status(201).json({ input });
  } catch (err) {
    console.log(err);
    return res.json({ err });
  }
});

app.get('/farmers/:id', async (req, res) => {
  const _id = req.params.id;
  try {
    const farmer = await Farmer.findById({ _id });
    return res.status(201).json({ farmer });
  } catch (err) {
    return res.json({ err });
  }
});

app.get('/farmers', async (req, res) => {
  try {
    const farmers = await Farmer.find({});
    return res.status(201).json({ farmers });
  } catch (err) {
    return res.json({ err });
  }
});

app.put('/farmers/input/:id', async (req, res) => {
  const farmer_id = req.params.farmer_id;
  const _id = req.params.id;
  try {
    const input = await Farmer.update(
      { 'inputs._id': _id },
      { $set: { inputs: req.body } }
    );
    //   const input = Farmer.updateOne({ _id: farmer_id, 'inputs._id': -_id },
    //     {$set: {inputs: req.body}}, // list fields you like to change
    //     //   { 'new': true, 'safe': true, 'upsert': true }
    //   );
    return res.status(201).json({ input });
  } catch (error) {}
});

app.listen(5000, () => console.log('Working and running'));
