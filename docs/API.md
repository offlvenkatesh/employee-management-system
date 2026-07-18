# EMS API Documentation

Base URL: `http://localhost:4000`

All protected endpoints require:

```http
Authorization: Bearer <jwt>
```

Errors use this shape:

```json
{
  "title": "VALIDATION_ERROR",
  "status": 422,
  "detail": "Validation failed",
  "errors": [{ "path": "email", "message": "Valid email is required" }],
  "request_id": "..."
}
```

## Health

### GET `/health`

Liveness check.

### GET `/ready`

Readiness check including database connectivity.

## Authentication

### POST `/api/auth/login`

```json
{
  "email": "admin@ems.test",
  "password": "Admin@123"
}
```

Response:

```json
{
  "token": "jwt",
  "user": {
    "id": "...",
    "employeeId": "EMS-0001",
    "name": "Anika Rao",
    "email": "admin@ems.test",
    "role": "SUPER_ADMIN"
  }
}
```

### POST `/api/auth/logout`

Protected. Returns `204 No Content`.

### GET `/api/auth/me`

Protected. Returns the authenticated employee profile.

## Dashboard

### GET `/api/dashboard/stats`

Protected.

Response:

```json
{
  "data": {
    "totalEmployees": 6,
    "activeEmployees": 5,
    "inactiveEmployees": 1,
    "departmentCount": 5,
    "roleBreakdown": [{ "role": "EMPLOYEE", "count": 4 }],
    "recentEmployees": []
  }
}
```

## Employees

### GET `/api/employees`

Protected.

Query parameters:

| Name | Values |
| --- | --- |
| `search` | Name/email text |
| `department` | Department name |
| `role` | `SUPER_ADMIN`, `HR_MANAGER`, `EMPLOYEE` |
| `status` | `ACTIVE`, `INACTIVE` |
| `sortBy` | `joiningDate`, `name` |
| `sortOrder` | `asc`, `desc` |
| `page` | Positive number |
| `limit` | 1 to 100 |

### POST `/api/employees`

Super Admin or HR Manager.

```json
{
  "employeeId": "EMS-0100",
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "phone": "+1 555 0199",
  "department": "Engineering",
  "designation": "QA Engineer",
  "salary": 90000,
  "joiningDate": "2024-01-15",
  "status": "ACTIVE",
  "role": "EMPLOYEE",
  "reportingManager": null,
  "profileImage": "",
  "password": "Welcome@123"
}
```

### GET `/api/employees/:id`

Protected. Employees can only fetch their own record.

### PUT `/api/employees/:id`

Protected. HR/Super Admin can update employees. Employees can only update `phone` and `profileImage` on their own profile.

### DELETE `/api/employees/:id`

Super Admin only. Soft deletes the employee and clears them as a reporting manager.

### GET `/api/employees/:id/reportees`

Protected. Returns direct reports for an employee.

### PATCH `/api/employees/:id/manager`

Super Admin or HR Manager.

```json
{
  "reportingManager": "64f000000000000000000001"
}
```

Use `null` to remove the manager. The API rejects circular reporting chains.

### POST `/api/employees/import`

Super Admin or HR Manager. Multipart form upload with field name `file`.

CSV headers:

```csv
employeeId,name,email,phone,department,designation,salary,joiningDate,status,role,password
```

## Organization

### GET `/api/organization/tree`

Protected. Returns nested reporting tree nodes:

```json
{
  "data": [
    {
      "id": "...",
      "name": "Anika Rao",
      "children": []
    }
  ]
}
```
