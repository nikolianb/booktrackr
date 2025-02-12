const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    authors: [{ type: String }],
    publishedDate: { type: String },
    description: { type: String },
    industryIdentifiers: [
        {
            type: { type: String }, 
            identifier: { type: String }
        }
    ],
    pageCount: { type: Number },
    categories: [{ type: String }],
    imageLinks: {
        smallThumbnail: { type: String },
        thumbnail: { type: String }
    },
    language: { type: String },
    previewLink: { type: String },
    infoLink: { type: String },
    source: { type: String, enum: ["GoogleBooks", "OpenLibrary"], required: true } 
});

module.exports = mongoose.model('Book', bookSchema);
