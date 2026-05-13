const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const saltRounds = 12;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["farmer", "buyer", "admin"],
      default: "buyer",
    },
    phone: { type: String, trim: true },
    address: {
      village: String,
      district: String,
      state: String,
      pincode: String,
    },
    profileImage: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    // Farmer-specific
    farmDetails: {
      farmSize: Number, // in acres
      cropTypes: [String],
      farmLocation: String,
    },
    // Buyer-specific
    businessDetails: {
      businessName: String,
      gstNumber: String,
    },
    // Payment details (for receiving payouts — farmers; or preferences — buyers)
    paymentDetails: {
      upiId: String,
      bankAccountNumber: String,
      bankIfscCode: String,
      bankAccountHolderName: String,
      preferredMethod: { type: String, enum: ['upi', 'bank_transfer'], default: 'upi' },
    },
  },
  { timestamps: true },
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
