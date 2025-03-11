import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

// Even when graphql server can be added, it will be deployed as a lambda (lifetime constrained)

// Define your GraphQL schema
const typeDefs = `
  type Query {
    hello: String
  }
`;

// Define your resolvers
const resolvers = {
  Query: {
    hello: () => 'Hello from Vercel Function!',
  },
};

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Create handler for Vercel Function
export default startServerAndCreateNextHandler(server);

/*
curl --request POST \
    --header 'content-type: application/json' \
    --url http://localhost:3000/api/nodejs/graphql \
    --data '{"query":"query ExampleQuery {\n  hello\n}"}'
*/