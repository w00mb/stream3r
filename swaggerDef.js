const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Your Project Name API',
    version: '1.0.0',
    description: 'API documentation for Your Project Name application.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session_token',
      },
    },
  },
  security: [
    {
      cookieAuth: [],
    },
  ],
};

module.exports = swaggerDef;