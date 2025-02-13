const express = require("express");
const axios = require("axios");
const Book = require("../models/Book");

const router = express.Router();

router.get("/search/:title", async (req, res) => {
    const { title } = req.params;

    try {
        let books = await Book.find({ title: new RegExp(title, "i") });
        if (books.length > 0) return res.json(books);

        const googleRes = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${title}`);
        if (googleRes.data.totalItems > 0) {
            const booksFromGoogle = googleRes.data.items.map((item) => {
                const bookData = item.volumeInfo;

                return new Book({
                    title: bookData.title,
                    authors: bookData.authors || [],
                    publishedDate: bookData.publishedDate,
                    description: bookData.description,
                    industryIdentifiers: bookData.industryIdentifiers || [],
                    pageCount: bookData.pageCount,
                    categories: bookData.categories || [],
                    imageLinks: bookData.imageLinks || {},
                    language: bookData.language,
                    previewLink: bookData.previewLink,
                    infoLink: bookData.infoLink,
                    source: "GoogleBooks",
                });
            });

            await Book.insertMany(booksFromGoogle);

            return res.json(booksFromGoogle);
        }

        res.status(404).json({ message: "No books found" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error searching for books" });
    }
});

router.get("/:bookId", async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json(book);
    } catch (error) {
        console.error("Error fetching book:", error);
        res.status(500).json({ message: "Server error while fetching book" });
    }
});
module.exports = router;
