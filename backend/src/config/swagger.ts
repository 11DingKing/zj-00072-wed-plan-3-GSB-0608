import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "婚礼筹备管理系统 API",
      version: "1.0.0",
      description: "婚礼筹备全流程管理系统 API 文档",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "开发服务器",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(options);
