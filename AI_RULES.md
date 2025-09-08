# AI Development Rules

This document outlines the technical stack and best practices for developing this application. Adhering to these guidelines ensures consistency, maintainability, and efficient development.

## Tech Stack Overview

*   **React:** The primary JavaScript library for building user interfaces.
*   **TypeScript:** Used for all application code to provide type safety, improve code quality, and enhance developer experience.
*   **React Router:** Manages client-side routing, with all main application routes defined within `src/App.tsx`.
*   **Tailwind CSS:** A utility-first CSS framework used exclusively for styling all components and layouts, ensuring responsive design.
*   **shadcn/ui:** A collection of pre-built, accessible, and customizable UI components that are integrated into the project.
*   **Radix UI:** The foundational library providing unstyled, accessible components that shadcn/ui builds upon.
*   **lucide-react:** A library for beautiful and customizable open-source icons, used throughout the application for visual elements.
*   **Project Structure:** All source code resides in the `src` directory. Page-level components are located in `src/pages/`, and reusable UI components are in `src/components/`.
*   **Main Entry Point:** The default application page is `src/pages/Index.tsx`, which should be updated to include new components or features.

## Library Usage Rules

*   **React:** All UI development must be done using React.
*   **TypeScript:** All new `.tsx` and `.ts` files must use TypeScript.
*   **React Router:** Use for all navigation. Define routes in `src/App.tsx`.
*   **Tailwind CSS:** All styling must be implemented using Tailwind CSS utility classes. Avoid creating custom CSS files or inline styles unless absolutely necessary and explicitly requested.
*   **shadcn/ui:** Prioritize using existing shadcn/ui components for common UI patterns. Do not modify the original shadcn/ui component files; if a component needs significant customization beyond its props, create a new component that wraps or extends the shadcn/ui component.
*   **Radix UI:** Direct usage of Radix UI components is generally not required, as shadcn/ui components already leverage them.
*   **lucide-react:** Use for all icon requirements within the application.
*   **Component Creation:** Always create new files for new components or hooks, no matter how small. Components should ideally be 100 lines of code or less.
*   **File Naming:** Directory names must be all lower-case (e.g., `src/pages`, `src/components`). File names may use mixed-case (e.g., `UserProfile.tsx`).