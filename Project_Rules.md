# HostelOS Architecture Rules

## Core Rules
- Never change API response structure unless explicitly requested
- Never remove existing routes
- Never rename database fields without migration
- Never break JWT auth flow
- Never hardcode secrets
- Never modify socket event names without updating both frontend and backend
- Never replace working logic with mock data
- Preserve role-based access control
- Maintain separation of concerns

## Frontend Rules
- Use reusable components
- Keep API calls inside services
- Do not place fetch logic directly in UI components
- Maintain existing route structure
- Preserve localStorage token handling

## Backend Rules
- Use controllers/services separation
- Validate all inputs
- Keep routes RESTful
- Use middleware for auth and validation
- Never expose sensitive data

## Database Rules
- Backward-compatible schema updates only
- Add indexes for frequent queries
- Use references properly

## Coding Style
- Keep modular architecture
- Avoid massive files
- Use async/await consistently
- Add comments for complex logic