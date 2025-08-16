# stream3r

[![CI/CD Pipeline](https://github.com/w00mb/stream3r/actions/workflows/main.yml/badge.svg)](https://github.com/w00mb/stream3r/actions)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## Getting Started

Follow these instructions to get the application up and running using Docker.

### Prerequisites

*   [Node.js](https://nodejs.org/) and npm
*   [Docker](https://www.docker.com/products/docker-desktop/)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/w00mb/stream3r.git
    cd stream3r
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Initialize the database:**
    This command sets up the SQLite database schema.
    ```sh
    npm run db:init
    ```

4.  **Build and run the container:**
    This will build the Docker image and start the application.
    ```sh
    docker compose up
    ```

5.  **Access the application:**
    Once the container is running, you can access the application at [http://localhost:3000](http://localhost:3000).