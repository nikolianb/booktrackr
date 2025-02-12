const express = require("express");
const axios = require("axios");
const Book = require("../models/Book");
const authMiddleware = require("../middleware/authMiddleware");
const UserBook = require("../models/UserBook");

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

        const openLibraryRes = await axios.get(`https://openlibrary.org/search.json?title=${title}`);
        if (openLibraryRes.data.numFound > 0) {
            const booksFromOpenLibrary = openLibraryRes.data.docs.map((item) => {
                return new Book({
                    title: item.title,
                    authors: item.author_name || [],
                    publishedDate: item.first_publish_year?.toString() || "",
                    description: "",
                    industryIdentifiers: item.isbn ? [{ type: "ISBN_13", identifier: item.isbn[0] }] : [],
                    pageCount: 0,
                    categories: [],
                    imageLinks: {
                        smallThumbnail: `https://covers.openlibrary.org/b/id/${item.cover_i}-S.jpg`,
                        thumbnail: `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`,
                    },
                    language: item.language?.[0] || "unknown",
                    previewLink: `https://openlibrary.org${item.key}`,
                    infoLink: `https://openlibrary.org${item.key}`,
                    source: "OpenLibrary",
                });
            });

            await Book.insertMany(booksFromOpenLibrary);

            return res.json(booksFromOpenLibrary);
        }

        res.status(404).json({ message: "No books found" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error searching for books" });
    }
});

router.post("/favorite", authMiddleware, async (req, res) => {
    const { bookId } = req.body;
    const userId = req.user.userId;

    try {
        let userBook = await UserBook.findOne({ userId, bookId });
        if (!userBook) {
            userBook = new UserBook({ userId, bookId, isFavorite: true });
        } else {
            userBook.isFavorite = !userBook.isFavorite;
        }

        await userBook.save();
        res.json({ message: "Favorite status updated", isFavorite: userBook.isFavorite });
    } catch (error) {
        res.status(500).json({ message: "Error updating favorite status" });
    }
});

router.get("/favorites", authMiddleware, async (req, res) => {
    const userId = req.user.userId;

    try {
        const favoriteBooks = await UserBook.find({ userId, isFavorite: true }).populate("bookId");
        res.json(favoriteBooks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching favorite books" });
    }
});

router.post("/status", authMiddleware, async (req, res) => {
    const { bookId, status } = req.body;
    const userId = req.user.userId;

    try {
        let userBook = await UserBook.findOneAndUpdate(
            { userId, bookId },
            { status },
            { new: true, upsert: true }
        );

        res.json({ message: "Reading status updated", status: userBook.status });
    } catch (error) {
        res.status(500).json({ message: "Error updating reading status" });
    }
});

router.get("/read-later", authMiddleware, async (req, res) => {
    const userId = req.user.userId;

    try {
        const readLaterBooks = await UserBook.find({ userId, status: "Read Later" }).populate("bookId");
        res.json(readLaterBooks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching read later books" });
    }
});

module.exports = router;
