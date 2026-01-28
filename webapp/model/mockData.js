sap.ui.define([], () => {
    "use strict";

    // In-memory mock data (prototype)
    return {
        nextIds: {
            Courses: 10,
            CourseSections: 10,
            Prerequisites: 10
        },
        Programmes: [
            { ID: 1, name: "SECJH Software Engineering" },
            { ID: 2, name: "SECVH Graphics & Multimedia Software" },
            { ID: 3, name: "SECPH Data Engineering" },
            { ID: 4, name: "SECRH Computer Networks & Security" }
        ],
        Lecturers: [
            { ID: 1, name: "Dr. Ahmad Rahman" },
            { ID: 2, name: "Dr. Siti Aminah" },
            { ID: 3, name: "Dr. Mohd Faisal" },
            { ID: 4, name: "Dr. Nurul Izza" },
            { ID: 5, name: "Dr. Wong Lee Peng" }
        ],
        Venues: [
            { ID: 1, name: "N28 BK6" },
            { ID: 2, name: "N28 BK7" },
            { ID: 3, name: "N28 BK8" },
            { ID: 4, name: "N28 BK9" },
            { ID: 5, name: "N28 BK10" }
        ],
        Courses: [
            { ID: 1, courseCode: "SECP1513", courseName: "Programming Technique I", creditHours: 3, programme: "Software Engineering", year: 1 },
            { ID: 2, courseCode: "SECJ1013", courseName: "Data Structure and Algorithm", creditHours: 3, programme: "Software Engineering", year: 2 },
            { ID: 3, courseCode: "SECR2043", courseName: "Object Oriented Programming", creditHours: 3, programme: "Software Engineering", year: 2 },
            { ID: 4, courseCode: "SECP2613", courseName: "Database", creditHours: 3, programme: "Software Engineering", year: 2 }
        ],
        CourseSections: [
            { ID: 1, course_ID: 1, lecturer_ID: 1, venue_ID: 1, studentQuota: 40, dayOfWeek: "Monday", startTime: "08:00", endTime: "09:30" },
            { ID: 2, course_ID: 1, lecturer_ID: 2, venue_ID: 2, studentQuota: 40, dayOfWeek: "Tuesday", startTime: "10:00", endTime: "11:30" },
            { ID: 3, course_ID: 2, lecturer_ID: 1, venue_ID: 1, studentQuota: 35, dayOfWeek: "Monday", startTime: "14:00", endTime: "15:30" }
        ],
        Prerequisites: [
            { ID: 1, course_ID: 2, prerequisiteCourse_ID: 1 },
            { ID: 2, course_ID: 3, prerequisiteCourse_ID: 1 },
            { ID: 3, course_ID: 3, prerequisiteCourse_ID: 2 }
        ]
    };
});

