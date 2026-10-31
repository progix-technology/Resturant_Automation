import mongoose from 'mongoose';

const menuCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 1,
    },
    icon: {
      type: String,
      default: 'Utensils',
    },
    restaurantSlug: {
      type: String,
      required: true,
      default: 'spice-garden',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

menuCategorySchema.index({ restaurantSlug: 1, categoryId: 1 }, { unique: true });

export const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);

