const mongoose = require("mongoose");

const userBookSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    isFavorite: { type: Boolean, default: false },
    status: { type: String, enum: ["Unread", "Reading", "Read"], default: "Unread" },
    rating: { type: Number, min: 0, max: 5, default: null },
}, { timestamps: true });

module.exports = mongoose.model("UserBook", userBookSchema);
