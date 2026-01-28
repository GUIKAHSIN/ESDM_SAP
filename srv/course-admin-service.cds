/**
 * Course Admin Service - In-memory prototype
 * No DB binding; all CRUD implemented in course-admin-service.js
 */
service CourseAdminService {
  entity Programmes {
    key ID   : Integer;
    name     : String(100);
  }

  entity Lecturers {
    key ID   : Integer;
    name     : String(150);
  }

  entity Venues {
    key ID   : Integer;
    name     : String(100);
  }

  entity Courses {
    key ID         : Integer;
    courseCode     : String(20);
    courseName     : String(200);
    creditHours    : Decimal(3,1);
    programme      : String(100);
    year           : Integer;
  }

  entity CourseSections {
    key ID           : Integer;
    course_ID        : Integer;
    lecturer_ID      : Integer;
    venue_ID         : Integer;
    studentQuota     : Integer;
    dayOfWeek        : String(20);
    startTime        : String(10);
    endTime          : String(10);
  }

  entity Prerequisites {
    key ID                 : Integer;
    course_ID              : Integer;
    prerequisiteCourse_ID  : Integer;
  }
}
