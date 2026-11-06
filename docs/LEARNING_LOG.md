# Learning Log: MongoDB + Mongoose

## Why I picked it

A candidate's notes and AI summary are usually accessed together with the candidate's information, so storing them in the same MongoDB document made sense for this project.

I'm more familiar with PostgreSQL and Prisma, so I decided to use MongoDB and Mongoose as an opportunity to learn a different approach to working with databases.

I wanted to understand not just how to make it work, but also how MongoDB handles data differently from a relational database.

## What I read

I started with the official documentation to understand the basics before implementing the database layer.

- [Mongoose: Connections](https://mongoosejs.com/docs/connections.html): how to connect an application to MongoDB, manage the connection and handle connection errors.
- [Mongoose: Schemas](https://mongoosejs.com/docs/guide.html): how schemas define the structure of documents, including field types, default values and options such as `timestamps`.
- [Mongoose: Validation](https://mongoosejs.com/docs/validation.html#update-validators): how validation works and, importantly, why update operations don't necessarily run validators unless `runValidators: true` is specified.
- [Mongoose: Lean](https://mongoosejs.com/docs/tutorials/lean.html): how `.lean()` returns plain JavaScript objects instead of full Mongoose documents. This is useful when I only need to read and return data without using Mongoose document methods.
- [MongoDB: $push](https://www.mongodb.com/docs/manual/reference/operator/update/push/): how to append an item to an array inside a document using an atomic update, without having to read the entire document and save it again.

## How I approached learning

I started with the official documentation to understand the concepts and how Mongoose works under the hood.

I generally prefer combining documentation with visual learning. If I had more time, I'd also watch tutorials or walkthrough videos to see how other developers work with MongoDB and Mongoose in practice. Seeing someone build something step by step can help me understand how different concepts fit together and expose me to approaches I might not have considered.

For this project, I focused on reading the relevant documentation, understanding the parts I needed, and applying them directly to the code.

## What confused me

- **Sorting by stage.** MongoDB sorts strings alphabetically, which would put INTERVIEW before SCREENING. So the repository sorts only by date, and the service sorts by pipeline order.

## What I'd tell the next engineer

- Don't assume MongoDB sorts string values in the order your business process expects. It sorts alphabetically.
- Keep business-specific ordering in one place, such as the `STAGES` constant, rather than duplicating it across the application.
- Be aware that `.sort({ stage: 1 })` won't give you the correct recruitment pipeline order.
- If you use Mongoose update methods, remember to enable `runValidators: true` when you need schema validation to run.
- Use `.lean()` for read-only queries when you don't need full Mongoose document functionality.
- Consider atomic operators such as `$push` when updating arrays inside documents.

One limitation of my current approach is that sorting by stage happens in the application rather than in MongoDB. This means the application needs to load all matching candidates before sorting them.

That's perfectly reasonable for a small application, but if the dataset grows significantly, I'd consider storing a numeric stage order (for example, `1` for APPLIED and `2` for SCREENING). That would allow MongoDB to handle the sorting directly and make pagination more efficient.
