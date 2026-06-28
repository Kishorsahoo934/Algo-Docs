import { MongoClient } from 'mongodb';

let client = null;

async function getMongoClient(uri) {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return res.status(500).json({ error: 'MONGODB_URI environment variable is missing' });
  }

  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const mongoClient = await getMongoClient(uri);
    const db = mongoClient.db('algodocs_db');
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = { name, email, password, createdAt: new Date() };
    const result = await usersCollection.insertOne(newUser);

    return res.status(200).json({
      status: 'success',
      message: 'User registered in MongoDB Atlas',
      user: { name, email },
      result
    });
  } catch (err) {
    return res.status(500).json({ error: `Database error: ${err.message}` });
  }
}
