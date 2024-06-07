const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/exercise-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err.message);
});

// Modelos
const User = require('./models/user');
const Exercise = require('./models/exercise');

// Crear un nuevo usuario
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  try {
    const newUser = new User({ username });
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    res.status(400).json({ error: 'Error al crear el usuario' });
  }
});

// Obtener la lista de usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: 'Error al obtener los usuarios' });
  }
});

// Añadir un ejercicio usando el nuevo estilo
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const _id = req.params._id;
    const foundUser = await User.findOne({ "_id": _id });

    if (!foundUser) {
      return res.status(404).json({ "message": `User with id ${_id} not found` });
    }

    const { username } = foundUser;
    const { description, duration, date } = req.body;
    const newExercise = {
      userId: _id,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date).toDateString() : new Date().toDateString()
    };

    const created = await Exercise.create(newExercise);
    const exercise = {
      username,
      description: created.description,
      duration: created.duration,
      date: created.date,
      _id: _id
    };

    res.status(201).json(exercise);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ "message": "Server error" });
  }
});

// Obtener el log de ejercicios de un usuario
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    let query = { userId: _id };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    let exercises = await Exercise.find(query).limit(parseInt(limit)).exec();

    exercises = exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: new Date(ex.date).toDateString()
    }));

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises
    });
  } catch (err) {
    res.status(400).json({ error: 'Error al obtener el log de ejercicios' });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
