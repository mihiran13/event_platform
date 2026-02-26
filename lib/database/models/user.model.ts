import { Schema, model, models } from 'mongoose';

export interface IUser {
  clerkId: string
  email: string
  username: string
  photo: string
  firstName: string
  lastName: string
  planId: string
  creditBalance: number
}

const userSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    photo: { type: String, required: true },
  }
)

const User = models.User || model<IUser>('User', userSchema)

export default User