import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const restaurantAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      default: 'Restaurant Admin',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'],
      default: 'ADMIN',
    },
    title: {
      type: String,
      default: 'Head of Operations',
    },
    avatar: {
      type: String,
      default: '',
    },
    restaurantId: {
      type: String,
      default: 'rest-001',
    },
    restaurantSlug: {
      type: String,
      default: 'spice-garden',
    },
  },
  {
    timestamps: true,
  }
);

restaurantAdminSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.passwordHash);
};

export const RestaurantAdmin = mongoose.model('RestaurantAdmin', restaurantAdminSchema);
