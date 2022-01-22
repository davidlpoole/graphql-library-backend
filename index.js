const { ApolloServer, gql, UserInputError } = require('apollo-server')
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
    addBook: async (root, args) => {
      const book = new Book({ ...args })
      try {
        await book.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
      return book
    },
    addAuthor: async (root, args) => {
      const author = new Author({ ...args })
      try {
        await author.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
      return author
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name })
      author.born = args.setBornTo
      try {
        await Author.updateOne({ name: args.name, $set: author })
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
      return author
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