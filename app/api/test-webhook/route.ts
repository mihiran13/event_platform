import { NextResponse } from 'next/server'

interface TestStep {
  step: string
  success: boolean
  message: string
  data?: Record<string, unknown>
}

export async function GET() {
  console.log('🧪 Test endpoint hit!')
  
  const results = {
    timestamp: new Date().toISOString(),
    steps: [] as TestStep[],
  }

  // Step 1: Check environment variables
  const envCheck: Record<string, boolean> = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    WEBHOOK_SECRET: !!process.env.WEBHOOK_SECRET,
    CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  }
  
  const allEnvSet = Object.values(envCheck).every(Boolean)
  const missingEnv = Object.entries(envCheck)
    .filter(([, v]) => !v)
    .map(([k]) => k)
    .join(', ')
  
  results.steps.push({
    step: 'Environment Variables Check',
    success: allEnvSet,
    message: allEnvSet 
      ? 'All required environment variables are set' 
      : 'Missing: ' + missingEnv,
    data: envCheck,
  })

  // If env vars missing, return early
  if (!allEnvSet) {
    return NextResponse.json(results)
  }

  // Step 2: Test MongoDB Connection
  try {
    const { connectToDatabase } = await import('@/lib/database')
    await connectToDatabase()
    results.steps.push({
      step: 'MongoDB Connection',
      success: true,
      message: 'Successfully connected to MongoDB',
    })
  } catch (error: unknown) {
    results.steps.push({
      step: 'MongoDB Connection',
      success: false,
      message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(results)
  }

  // Step 3: Check if users collection exists
  try {
    const userModule = await import('@/lib/database/models/user.model')
    const User = userModule.default
    const userCount = await User.countDocuments()
    results.steps.push({
      step: 'Users Collection Check',
      success: true,
      message: `Users collection exists with ${userCount} user(s)`,
      data: { userCount: userCount },
    })
  } catch (error: unknown) {
    results.steps.push({
      step: 'Users Collection Check',
      success: false,
      message: `Error checking users: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  // Step 4: Test creating a dummy user
  try {
    const userModule = await import('@/lib/database/models/user.model')
    const User = userModule.default
    
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
      data: { userId: createdUser._id?.toString(), clerkId: createdUser.clerkId },
    })

    // Clean up
    if (createdUser._id) {
      await User.findByIdAndDelete(createdUser._id)
      results.steps.push({
        step: 'Cleanup Test User',
        success: true,
        message: 'Test user deleted successfully',
      })
    }
  } catch (error: unknown) {
    results.steps.push({
      step: 'Create Test User',
      success: false,
      message: `Failed to create test user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  return NextResponse.json(results, { status: 200 })
}