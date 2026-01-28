## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Wed Jan 28 2026 16:07:26 GMT+0000 (Coordinated Universal Time)|
|**App Generator**<br>SAP Fiori Application Generator|
|**App Generator Version**<br>1.20.1|
|**Generation Platform**<br>SAP Business Application Studio|
|**Template Used**<br>Basic|
|**Service Type**<br>None|
|**Service URL**<br>N/A|
|**Module Name**<br>admin|
|**Application Title**<br>App Title|
|**Namespace**<br>|
|**UI5 Theme**<br>sap_horizon|
|**UI5 Version**<br>1.144.0|
|**Enable TypeScript**<br>False|
|**Add Eslint configuration**<br>False|

## admin

An SAP Fiori application.

### Starting the generated app

-   This app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite.  To launch the generated application, run the following from the generated application root folder:

```
    npm start
```

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)

---

## Course Master Data Administration (UTHM)

Admin-only module for the Subject Registration Enhancement System: courses, sections, prerequisites, and timetable scheduling. SAP CAP-style backend (in-memory), UI5 frontend.

### Run the full stack

1. **Start the CAP OData API** (port 4004):
   ```bash
   npm run start:api
   ```
2. **Start the UI5 app** (Fiori run):
   ```bash
   npm start
   ```
   Then open the URL shown (e.g. `.../test/flp.html#app-preview` or `.../index.html`).

### Functional scope

- **Course Master Data**: Create, update, view. Attributes: Course code, name, credit hours, programme, year.
- **Course Sections**: Add sections to a course; assign lecturer, venue, student quota, day and time. One course, many sections.
- **Prerequisites**: Define prerequisite course for a course (must be completed before registration).
- **Timetable**: View sections by day/time; validations: same venue or same lecturer cannot be double-booked at the same time.

### Tech

- **Backend**: `srv/` (CDS service + in-memory handlers), `db/schema.cds` (domain model). No DB; mock data in `srv/course-admin-service.js`.
- **Frontend**: `webapp/` (UI5, OData V4 to `http://localhost:4004/odata/v4/course-admin/`).

