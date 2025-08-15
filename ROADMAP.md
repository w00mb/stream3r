# Project Roadmap

This document outlines the future direction and key development phases for the project.

## High-Level Goals

*   **Scalable Platform for Content Creators:** Evolve the current prototype into a robust, multi-tenant platform serving the needs of content creators.
*   **Data-Driven Development:** Leverage a single, centralized database for comprehensive analytics to inform architectural decisions, feature prioritization, and business strategy.
*   **Performance and Modernization:** Migrate the backend to a Rust and WebAssembly (WASM) based stack for significant performance improvements and new interactive possibilities.
*   **Consolidated Tooling:** Integrate various applications into a unified platform to streamline workflows for content creators.

## Phases

### Phase 1: Core Functionality & Foundation (Current State)

*   **Status:** Completed.
*   **Focus:** Establishing basic web application, authentication, and initial content management.
*   **Key Achievements:**
    *   Public-facing portfolio with profile, events, and feed.
    *   Admin panel for managing site settings, profile, social links, and posts.
    *   HTMX-powered frontend.
    *   SQLite database for all data.
    *   Dockerized development environment.
    *   Basic testing structure (Jest unit/integration tests).
    *   CI/CD pipeline with automated testing and Docker image build.
    *   Automated changelog generation and versioning (Semantic Release).
    *   Basic API contract generation setup.

### Phase 2: Enhanced Content Management & Analytics (Next Steps)

*   **Status:** In Progress / Planned.
*   **Focus:** Expanding content management capabilities and deepening analytical insights.
*   **Key Features:**
    *   **Advanced Feed Management:**
        *   Ability to edit and delete existing posts from the admin panel.
        *   Support for different types of feed content (e.g., images, videos, external links).
        *   Scheduling posts.
    *   **Comprehensive Event Management:**
        *   Ability to edit and delete existing events.
        *   More detailed event properties (e.g., categories, recurring events).
    *   **User Interaction Analytics:**
        *   Detailed tracking of user engagement beyond pageviews (e.g., clicks on specific elements, time spent on content).
        *   Visualization of analytics data in the admin panel.
    *   **User Management (Admin Panel):**
        *   Interface to manage user accounts (create, edit, delete users).
        *   Role-based access control for admin panel features.

### Phase 3: Multi-Tenancy & Scalability (Mid-Term)

*   **Status:** Planned.
*   **Focus:** Adapting the application to support multiple independent content creators.
*   **Key Features:**
    *   **Tenant Isolation:** Secure separation of data and resources for each content creator.
    *   **Custom Domains:** Support for content creators to use their own domain names.
    *   **Subscription/Billing System:** Integration with a payment gateway for platform monetization.
    *   **Scalable Database Solution:** Evaluation and potential migration from SQLite to a more robust database system if current strategy proves insufficient for multi-tenancy at scale.

### Phase 4: Rust/WASM Migration & Advanced Features (Long-Term)

*   **Status:** Planned.
*   **Focus:** Re-platforming the backend for maximum performance and exploring cutting-edge features.
*   **Key Features:**
    *   **Rust/WASM Backend:** Re-implement core backend logic in Rust, compiled to WebAssembly.
    *   **Real-time Features:** WebSockets for live updates, chat, or collaborative tools.
    *   **AI/ML Integrations:** Content recommendation, automated moderation, or creative assistance tools.
    *   **Advanced Media Processing:** Server-side image/video optimization and manipulation.

## Guiding Principles

*   **Minimal Third-Party Dependencies:** Prioritize lean solutions and custom implementations where feasible.
*   **Leverage Advanced SQLite Features:** Maximize the use of SQLite for data storage and analysis where appropriate.
*   **Actionable Intelligence:** Design systems to provide insights that directly inform development and business strategy.
*   **User-Centric Design:** Focus on creating intuitive and powerful tools for content creators.
