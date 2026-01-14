import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();
await connectDB();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  process.exit(1);
}

const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) {
  console.log('Admin already exists');
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);
await User.create({
  name: 'Admin',
  email: email.toLowerCase(),
  passwordHash,
  role: 'admin'
});

console.log('Admin user created');
process.exit(0);

