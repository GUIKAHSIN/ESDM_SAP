/**
 * Course Master Data - Domain Model
 * UTHM Subject Registration Enhancement System
 * In-memory prototype: entities are served by srv with custom handlers
 */

namespace courseadmin.db;

/**
 * Programme (e.g. Software Engineering, Computer Science)
 */
entity Programmes {
  key ID   : Integer;
  name     : String(100);
}

/**
 * Lecturer
 */
entity Lecturers {
  key ID   : Integer;
  name     : String(150);
}

/**
 * Venue / Room
 */
entity Venues {
  key ID   : Integer;
  name     : String(100);
}

/**
 * Course Master
 */
entity Courses {
  key ID           : Integer;
  courseCode       : String(20);
  courseName       : String(200);
  creditHours      : Decimal(3,1);
  programme        : String(100);
  year             : Integer;
}

/**
 * Section of a course: one course, many sections
 */
entity CourseSections {
  key ID           : Integer;
  course_ID        : Integer;
  lecturer_ID      : Integer;
  venue_ID         : Integer;
  studentQuota     : Integer;
  dayOfWeek        : String(20);   // e.g. "Monday", "Tuesday"
  startTime        : String(10);   // e.g. "08:00", "14:00"
  endTime          : String(10);   // e.g. "09:30", "15:30"
}

/**
 * Prerequisite: prerequisiteCourse must be completed before course
 */
entity Prerequisites {
  key ID                 : Integer;
  course_ID              : Integer;
  prerequisiteCourse_ID  : Integer;
}
