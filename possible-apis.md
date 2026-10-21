Feature ----- Planned endpoints	----- Estimated count
Auth	----- Login, current user/profile, change password, logout if needed ----- 3–4
Users	----- List, details, create, update, delete/manage access ----- 4–5
Departments	----- Create, list, details, update, delete ----- 5
Employees	----- Create, list, details, update, deactivate/delete ----- 5
Attendance	----- Clock in, clock out, my attendance, employee history, admin attendance list, attendance details ----- 5–6
Payroll structures ----- Create, list, details, update, delete ----- 5
Payroll heads	----- Create, list, details, update, delete	----- 5
Structure-head assignments	----- Configure, update, and remove payroll heads from a structure	----- 2–3
Work policy	----- View and update policy ----- 2
Payslips	----- Generate, list, view details, publish, view own payslips ----- 4–5
Dashboard	----- Summary statistics and relevant dashboard data ----- 2–3


Step 1 — Auth

Login, JWT authentication, current-user endpoint, password hashing, and role-based authorization.


Step 2 — Users, departments and employees

Build the core management APIs and their permissions.


Step 3 — Attendance

Implement clock-in/clock-out and attendance calculations. These simulate hardware events; actual device integration remains future work.


Step 4 — Payroll

Configure payroll structures, heads, work policy, monthly calculations and payslips.


Step 5 — Dashboard and frontend integration

Provide the aggregated data each dashboard actually needs.



## Step 1 — Departments API

5 endpoints
- POST /departments — create department
- GET /departments — list departments for dropdowns
- GET /departments/:id — view details
- PATCH /departments/:id — update department
- DELETE /departments/:id — delete department, only when safe
These endpoints support department management and the approval form.



## Step 2 — Employee approval API

3 core endpoints
- GET /employees/pending — list accounts awaiting approval
- PATCH /employees/:id/approve — assign department, payroll structure, join date and permanent employee code
- PATCH /employees/:id/reject — reject a registration
Only authorized admins should be able to use these endpoints. We also need a way for admins to restore a rejected account to pending, or remove it safely.


## Step 3 — Employee profile API

2 core endpoints
- GET /employees/me — get the employee's full profile
- PATCH /employees/me — update allowed fields, such as full name and phone
Email, employee ID, department, join date, payroll structure, and employment status must not be editable through this endpoint.

## Payroll Structure

- GET /payroll/structures - admin to retrieve available payroll structures for the approval dropdown.