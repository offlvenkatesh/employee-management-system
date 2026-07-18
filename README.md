# Employee Management System

A full-stack Employee Management System built for the Full Stack Developer hiring assignment.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Query, Recharts
- Backend: Node.js, Express, TypeScript, Mongoose
- Database: MongoDB
- Authentication: JWT and bcrypt password hashing
- Deployment: Docker Compose for MongoDB, API, and frontend

## Features

- Secure login/logout with JWT authentication
- Protected frontend routes and backend middleware
- Role-based access control for Super Admin, HR Manager, and Employee
- Employee CRUD with soft delete
- Employee fields: Employee ID, name, email, phone, department, designation, salary, joining date, status, role, reporting manager, profile image
- Dashboard metrics: total employees, active employees, inactive employees, department count
- Dashboard charts for role distribution and status mix
- Search by name/email
- Filter by department, role, and status
- Sort by joining date or name
- Pagination
- Reporting manager assignment
- Direct reportees endpoint and UI panel
- Organization tree view
- Circular reporting prevention
- Frontend and backend validation
- CSV import for employees
- Dark mode
- Docker support
- Unit test for hierarchy cycle detection

## Demo Accounts

Seed data creates these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@ems.test` | `Admin@123` |
| HR Manager | `hr@ems.test` | `Hr@12345` |
| Employee | `employee@ems.test` | `Employee@123` |

## Quick Start With Docker

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- Health: `http://localhost:4000/health`

The Docker server starts with `SEED_ON_START=true`, so demo accounts are created automatically.

## Vercel Deployment

The repository includes `vercel.json` and a serverless Express adapter at `api/index.ts`. On Vercel, the React app is served from `client/dist` and `/api/*` is rewritten to the API function.

Required Vercel environment variables for a full live deployment:

| Variable | Value |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random production secret |
| `JWT_EXPIRES_IN` | Example: `8h` |
| `CLIENT_ORIGIN` | Your Vercel deployment URL |
| `SEED_ON_START` | `true` for demo accounts, otherwise `false` |

`VITE_API_URL` can be omitted on Vercel because the frontend uses same-origin `/api` calls in production.

## Local Development

1. Install dependencies.

```bash
npm install
```

2. Copy env examples if you want to override defaults.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Start MongoDB locally or with Docker.

```bash
docker run --name ems-mongo -p 27017:27017 -d mongo:7
```

4. Seed demo data.

```bash
npm run seed
```

5. Start both apps.

```bash
npm run dev
```

## Verification Commands

```bash
npm run build
npm test
```

## Screenshots

- Dashboard: `docs/screenshots/dashboard.png`
- Employee management: `docs/screenshots/employees.png`
- Organization hierarchy: `docs/screenshots/organization.png`

## Project Structure

```text
client/
  src/components/       Reusable UI components
  src/pages/            Dashboard, Employees, Organization, Profile, Login
  src/providers/        Auth provider
  src/lib/              API client and token storage
server/
  src/auth/             Login, JWT auth middleware, RBAC helpers
  src/employees/        Employee model, validation, controller, service
  src/organization/     Reporting tree and cycle detection
  src/dashboard/        Dashboard stats
  src/shared/           Error handling, request ID, logging
  src/scripts/          Seed data
docs/API.md             API documentation
```

## RBAC Rules

- Super Admin: full access, can create/edit/delete employees, assign roles, assign managers.
- HR Manager: can create/edit/view employees and import CSV, cannot delete employees or assign Super Admin role.
- Employee: can view and edit only their own limited profile fields: phone and profile image.

## Notes

- Delete is implemented as soft delete by setting `isDeleted=true` and `status=INACTIVE`.
- Logout is stateless for JWT and clears the client token.
- For a production system, replace the demo JWT secret, use HTTPS, and move auth persistence to an httpOnly refresh-token flow.
