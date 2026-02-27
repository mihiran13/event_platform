import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import User from '@/lib/database/models/user.model'

export async function GET() {
  console.log('🧪 Test endpoint hit!')
  
  const results = {
    timestamp: new Date().toISOString(),
    steps: [] as { step: string; success: boolean; message: string; data?: any }[],
  }

  // Step 1: Check environment variables
  const envCheck = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    WEBHOOK_SECRET: !!process.env.WEBHOOK_SECRET,
    CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  }
  
  results.steps.push({
    step: 'Environment Variables Check',
    success: Object.values(envCheck).every(Boolean),
    message: Object.values(envCheck).every(Boolean) 
      ? 'All required environment variables are set' 
      : 'Some environment variables are missing',
    data: envCheck,
  })

  // Step 2: Test MongoDB Connection
  try {
    await connectToDatabase()
    results.steps.push({
      step: 'MongoDB Connection',
      success: true,
      message: 'Successfully connected to MongoDB',
    })
  } catch (error) {
    results.steps.push({
      step: 'MongoDB Connection',
      success: false,
      message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(results)
  }

  // Step 3: Check if users collection exists and count users
  try {
    const userCount = await User.countDocuments()
    results.steps.push({
      step: 'Users Collection Check',
      success: true,
      message: `Users collection exists with ${userCount} user(s)`,
      data: { userCount },
    })
  } catch (error) {
    results.steps.push({
      step: 'Users Collection Check',
      success: false,
      message: `Error checking users: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  // Step 4: Test creating a dummy user (will be deleted)
  try {
    const testUser = {
      clerkId: `test_${Date.now()}`,
      email: `test_${Date.now()}@test.com`,
      username: `test_user_${Date.now()}`,
      firstName: 'Test',
      lastName: 'User',
      photo: 'https://example.com/photo.jpg',
    }

    const createdUser = await User.create(testUser)
    results.steps.push({
      step: 'Create Test User',
      success: true,
      message: 'Successfully created a test user',
      data: { userId: createdUser._id, clerkId: createdUser.clerkId },
    })

    // Clean up - delete the test user
    await User.findByIdAndDelete(createdUser._id)
    results.steps.push({
      step: 'Cleanup Test User',
      success: true,
      message: 'Test user deleted successfully',
    })
  } catch (error) {
    results.steps.push({
      step: 'Create Test User',
      success: false,
      message: `Failed to create test user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  return NextResponse.json(results, { status: 200 })
}

export async function POST(request: Request) {
  console.log('🧪 Test POST endpoint hit!')
  
  try {
    const body = await request.json()
    
    return NextResponse.json({
      message: 'POST request received successfully',
      receivedData: body,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to parse request body',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 })
  }
}