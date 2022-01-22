const { ApolloServer, gql } = require('apollo-server')
const { v1: uuid } = require('uuid')

const mongoose = require('mongoose')
const config = require('./utils/config')
const Author = require('./models/author.js')
const Book = require('./models/book.js')

console.log('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }

    bookCount: Int!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(genre: String, author:String): [Book!]!
    allAuthors: [Author!]!
  }

  type Mutation{ 
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String]!
    ): Book
    addAuthor(
      name: String!
      born: Int
    ): Author
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      let books = await Book.find({}).populate('author')
      if (args.genre) {
        // await Book.find({ genres: { $in: args.genre } }).populate('author')
        books = books.filter(book => book.genres.includes(args.genre))
      }
      if (args.author) {
        books = books.filter(book => book.author.name.includes(args.author))
      }
      return books
    },
    allAuthors: async () => {
      return await Author.find({})
    }
  },
  Author: {
    bookCount: async (root, args) => {
      const authorsBooks = await Book.find({ author: root.id })
      return authorsBooks.length
    }
  },
  Mutation: {
      const book = new Book({ ...args })
    addBook: (root, args) => {
      const book = { ...args, id: uuid() }
      books = books.concat(book)

      exists = authors.find(a => a.name === args.author)

      if (!exists) {
        const author = { name: args.author, id: uuid() }
        authors = authors.concat(author)
      }
      return book
    },
    editAuthor: (root, args) => {
      const author = authors.find(a => a.name === args.name)
      if (!author) {
        return null
      }
      const updatedAuthor = { ...author, born: args.setBornTo }
      authors = authors.map(a => a.name === args.name ? updatedAuthor : a)
      return updatedAuthor
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})