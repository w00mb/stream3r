# w00mb

## Project Status & Information

| Category | Details |
|---|---|
| **CI/CD Pipeline** | ![CI/CD Pipeline Status](https://github.com/w00mb/stream3r/actions/workflows/main.yml/badge.svg) |
| **Latest Release** | [View Releases](https://github.com/w00mb/stream3r/releases) |
| **Code Quality** | (Placeholder for future badge, e.g., Code Climate, SonarCloud) |
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
*   **Refactored Stylesheet:** The stylesheet has been refactored for consistency and maintainability, using a modular approach with CSS variables, utility classes, and a reusable `.card` component.

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
├── Dockerfile
├── admin.html
├── docker-compose.yml
├── index.html
├── package.json
├── package-lock.json
├── partials
│   └── admin
│       ├── tab-bio.html
│       ├── tab-calender.html
│       ├── tab-design.html
│       ├── tab-feed.html
│       └── tab-metrics.html
├── public
│   └── htmx.min.js
├── schema.sql
├── server
│   ├── app.js
│   ├── db.js
│   ├── init-db.js
│   ├── routes-admin.js
│   ├── routes-auth.js
│   └── routes-public.js
└── styles.css
```

## Primitives Contract

The application is built around a set of core data primitives, which represent the main entities in the system. These primitives are defined in the `schema.sql` file and are the foundation of the application's data model.

*   **`Profile`**: Represents the artist's profile, including their name, bio, and image.
*   **`SocialLink`**: Represents a link to a social media profile or website.
*   **`Event`**: Represents an upcoming event, such as a gallery opening or a live stream.
*   **`User`**: Represents a user account with authentication credentials.
*   **`SiteSetting`**: Represents a key-value pair for site-wide settings, such as design tokens.

## Database Structure

The database schema is defined in the `schema.sql` file and is designed to be both simple and powerful. It leverages SQLite's features, such as foreign key constraints, triggers, and views, to maintain data integrity and simplify application logic.

The main tables in the database are:

*   **`profile`**: Stores the artist's profile information.
*   **`social_links`**: Stores the social media links associated with the profile.
*   **`events`**: Stores the upcoming events.
*   **`users`**: Stores user accounts and their hashed passwords.
*   **`sessions`**: Stores user session information for authentication.
*   **`site_settings`**: Stores site-wide settings as key-value pairs.
*   **`metrics_daily`**: Stores daily analytics data, such as pageviews and unique visitors.

## Versioning

This project adheres to [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html). The version number is managed in the `package.json` file.
