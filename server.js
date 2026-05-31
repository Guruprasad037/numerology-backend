const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Numerology Backend Running');
});

app.post('/reading', (req, res) => {
  const { name, dob } = req.body;

  res.json({
    name,
    dob_fmt: dob,
    birth_num: 7,
    destiny_num: 6,
    traits: [
      "Analytical",
      "Independent",
      "Thoughtful",
      "Intuitive",
      "Loyal"
    ],
    reading: `Hello ${name}. This is a test response from your backend.`
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});