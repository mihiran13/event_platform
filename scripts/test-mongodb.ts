import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  console.log('🔄 Attempting to connect to MongoDB...');
  console.log('📍 Connection string (masked):', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'evently',
      bufferCommands: false,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test a simple operation
    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections in database:', collections.map(c => c.name).join(', ') || '(none yet)');
    
    // Check users collection
    const usersCollection = collections.find(c => c.name === 'users');
    if (usersCollection) {
      const users = await db.collection('users').find({}).toArray();
      console.log('👤 Users in database:', users.length);
      users.forEach(u => console.log(`   - ${u.firstName} ${u.lastName} (${u.email})`));
    }
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

testConnection();