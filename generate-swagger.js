const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');
const swaggerDef = require('./swaggerDef');

const options = {
  swaggerDefinition: swaggerDef,
  apis: ['./server/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

fs.writeFileSync(path.join(__dirname, 'swagger.json'), JSON.stringify(specs, null, 2));

console.log('Swagger JSON generated at swagger.json');