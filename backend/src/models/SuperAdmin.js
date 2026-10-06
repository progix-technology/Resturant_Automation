import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const superAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      default: 'Super Admin',
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
      default: 'PLATFORM_SUPERADMIN',
      enum: ['PLATFORM_SUPERADMIN'],
    },
    title: {
      type: String,
      default: 'Platform Founder & Owner',
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    company: {
      type: String,
      default: 'Progix Technology Pvt Ltd',
    },
    isProtected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hardcode & protect the primary SuperAdmin (progixtechnology@gmail.com)
// Prevent modification of email or role if isProtected is true or email is progixtechnology@gmail.com
superAdminSchema.pre('save', function () {
  if (this.email === 'progixtechnology@gmail.com') {
    this.isProtected = true;
    this.role = 'PLATFORM_SUPERADMIN';
    // If attempting to alter email on an existing document, forbid it
    if (!this.isNew && this.isModified('email')) {
      throw new Error('CRITICAL SECURITY: Cannot modify protected SuperAdmin email!');
    }
  }
});

// Prevent deletion of protected SuperAdmin through any Mongoose query
const preventProtectedDelete = async function () {
  const filter = this.getFilter();
  if (
    filter?.email === 'progixtechnology@gmail.com' ||
    (filter?.$or && filter.$or.some((f) => f.email === 'progixtechnology@gmail.com'))
  ) {
    throw new Error('CRITICAL SECURITY: Protected SuperAdmin account cannot be deleted!');
  }
  
  // If query by _id, check the document
  if (filter?._id) {
    const doc = await this.model.findOne(filter);
    if (doc && (doc.email === 'progixtechnology@gmail.com' || doc.isProtected)) {
      throw new Error('CRITICAL SECURITY: Protected SuperAdmin account cannot be deleted!');
    }
  }
};

superAdminSchema.pre('deleteOne', preventProtectedDelete);
superAdminSchema.pre('deleteMany', preventProtectedDelete);
superAdminSchema.pre('findOneAndDelete', preventProtectedDelete);
superAdminSchema.pre('findByIdAndDelete', preventProtectedDelete);

// Helper method to compare passwords
superAdminSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.passwordHash);
};

export const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
