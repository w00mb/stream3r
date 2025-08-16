# Your Project Name

## Project Status & Information

| Category | Details |
|---|---|
| **CI/CD Pipeline** | ![CI/CD Status](https://github.com/w00mb/stream3r/actions/workflows/main.yml/badge.svg) |
| **Latest Release** | [Releases](https://github.com/w00mb/stream3r/releases) |
| **Stack Badges** | ![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-%23404d59.svg?logo=express&logoColor=%2361DAFB) ![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white) ![HTMX](https://img.shields.io/badge/HTMX-blue?logo=htmx&logoColor=white) ![Argon2](https://img.shields.io/badge/Argon2-blue) ![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) |
| **License** | [MIT License](LICENSE) |
| **Maintainers** | [Your Name](https://github.com/w00mb) |
| **Contributing** | [Contribution Guidelines](CONTRIBUTING.md) |

## Overview

Your Project Name is a bespoke, self-contained web application designed for a digital artist and storyteller. It serves as a personal portfolio and a platform for engaging with an audience, with a strong focus on minimizing third-party dependencies and leveraging the power of SQLite for data storage, analytics, and interactivity.

The application is built with a simple and robust stack, designed for easy prototyping and future migration to a more performant, Rust and WASM-based architecture.

## Features

*   **Public-facing Portfolio:** A clean and elegant interface to showcase the artist's profile, upcoming events, and a social media-style feed.
*   **Admin Panel:** A secure and intuitive admin panel for managing all aspects of the site, including design tokens, bio, and calendar events.
*   **Customizable Social Icons:** Option to use custom image URLs for social media buttons, providing more branding flexibility.
*   **Feed Management:** Admin interface to create and manage feed posts, allowing for dynamic content updates on the public-facing site.
*   **HTMX-powered Frontend:** A dynamic and responsive user experience with minimal JavaScript, powered by HTMX for partial page loads.
*   **SQLite-driven:** The entire application is backed by a single SQLite database file, which stores all data, from user accounts to site settings.
*   **Dockerized Environment:** The application is fully containerized using Docker and Docker Compose, ensuring a portable and sandboxed development environment.
*   **Secure Authentication:** User authentication is handled securely with password hashing using argon2.

## Tech Stack

*   **Backend:** Node.js, Express
*   **Frontend:** HTML, CSS, HTMX
*   **Database:** SQLite
*   **Containerization:** Docker, Docker Compose

## Getting Started

To get the application up and running, you will need to have Docker and Docker Compose installed on your system.

1.  **Build the Docker image:**
    ```bash
    docker-compose build
    ```

2.  **Initialize the database:**
    This command will run the database initialization script in a temporary container. This only needs to be done once.
    ```bash
    docker-compose run --rm app npm run db:init
    ```

3.  **Start the application:**
    ```bash
    docker-compose up
    ```

Your application will be available at `http://localhost:3000`.

To stop the application, you can press `Ctrl+C` in the terminal where `docker-compose up` is running, or you can run the following command in another terminal:
```bash
docker-compose down
```

## Directory Structure

```
.
├── .dockerignore
├── .gitignore
├── .releaserc.json
├── CONTRIBUTING.md
├── docker-compose.yml
├── Dockerfile
├── generate-swagger.js
├── jest.config.js
├── LICENSE
├── package-lock.json
├── package.json
├── POLICY.md
├── README.md
├── ROADMAP.md
├── swaggerDef.js
├── .github/
│   └── workflows/
│       └── main.yml
├── node_modules/
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── htmx.min.js
│   └── images/
├── src/
│   ├── backend/
│   │   ├── config/
│   │   ├── db/
│   │   │   ├── index.js
│   │   │   ├── init.js
│   │   │   └── schema.sql
│   │   ├── middleware/
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   └── public.js
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   ├── frontend/
│   │   ├── admin/
│   │   │   ├── index.html
│   │   │   └── partials/
│   │   │       ├── tab-bio.html
│   │   │       ├── tab-calender.html
│   │   │       ├── tab-design.html
│   │   │       ├── tab-feed.html
│   │   │       └── tab-metrics.html
│   │   ├── main/
│   │   │   └── index.html
│   │   └── components/
│   └── tests/
│       ├── backend/
│       │   ├── routes/
│       │   │   ├── admin.test.js
│       │   │   └── auth.test.js
│       │   └── db/
│       │       └── db.test.js
│       └── frontend/
```

## Versioning

This project adheres to [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html). The version number is managed in the `package.json` file.