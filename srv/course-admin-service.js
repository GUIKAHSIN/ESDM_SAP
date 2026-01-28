/**
 * Course Admin Service - In-memory implementation
 * Mock data, CRUD, and validations for timetable and prerequisites
 */

const cds = require('@sap/cds');

// ---------- In-memory store ----------
let _id = { Programmes: 10, Lecturers: 10, Venues: 10, Courses: 10, CourseSections: 10, Prerequisites: 10 };

const store = {
  Programmes: [
    { ID: 1, name: 'SECJH Software Engineering' },
    { ID: 2, name: 'SECVH Graphics & Multimedia Software' },
    { ID: 3, name: 'SECPH Data Engineering' },
    { ID: 4, name: 'SECRH Computer Networks & Security' }
  ],
  Lecturers: [
    { ID: 1, name: 'Dr. Ahmad Rahman' },
    { ID: 2, name: 'Dr. Siti Aminah' },
    { ID: 3, name: 'Dr. Mohd Faisal' },
    { ID: 4, name: 'Dr. Nurul Izza' },
    { ID: 5, name: 'Dr. Wong Lee Peng' }
  ],
  Venues: [
    { ID: 1, name: 'N28 BK6' },
    { ID: 2, name: 'N28 BK7' },
    { ID: 3, name: 'N28 BK8' },
    { ID: 4, name: 'N28 BK9' },
    { ID: 5, name: 'N28 BK10' }
  ],
  Courses: [
    { ID: 1, courseCode: 'SECP1513', courseName: 'Programming Technique I', creditHours: 3, programme: 'Software Engineering', year: 1 },
    { ID: 2, courseCode: 'SECJ1013', courseName: 'Data Structure and Algorithm', creditHours: 3, programme: 'Software Engineering', year: 2 },
    { ID: 3, courseCode: 'SECR2043', courseName: 'Object Oriented Programming', creditHours: 3, programme: 'Software Engineering', year: 2 },
    { ID: 4, courseCode: 'SECP2613', courseName: 'Database', creditHours: 3, programme: 'Software Engineering', year: 2 }
  ],
  CourseSections: [
    { ID: 1, course_ID: 1, lecturer_ID: 1, venue_ID: 1, studentQuota: 40, dayOfWeek: 'Monday', startTime: '08:00', endTime: '09:30' },
    { ID: 2, course_ID: 1, lecturer_ID: 2, venue_ID: 2, studentQuota: 40, dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '11:30' },
    { ID: 3, course_ID: 2, lecturer_ID: 1, venue_ID: 1, studentQuota: 35, dayOfWeek: 'Monday', startTime: '14:00', endTime: '15:30' }
  ],
  Prerequisites: [
    { ID: 1, course_ID: 2, prerequisiteCourse_ID: 1 },
    { ID: 2, course_ID: 3, prerequisiteCourse_ID: 1 },
    { ID: 3, course_ID: 3, prerequisiteCourse_ID: 2 }
  ]
};

function nextId(entity) {
  return ++_id[entity];
}

function timeToMinutes(t) {
  if (!t || typeof t !== 'string') return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function overlaps(day1, start1, end1, day2, start2, end2) {
  if (day1 !== day2) return false;
  const s1 = timeToMinutes(start1), e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2), e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

function getKeyValues(req) {
  const keys = {};
  for (const k of Object.keys(req.params)) if (k !== '0') keys[k] = req.params[k];
  return keys;
}

module.exports = async (srv) => {
  const { Courses, CourseSections, Prerequisites, Programmes, Lecturers, Venues } = srv.entities;

  // ---------- Generic READ ----------
  async function handleRead(entity, req) {
    let data = store[entity] || [];
    const keys = getKeyValues(req);
    const hasKeys = Object.keys(keys).length > 0;
    if (hasKeys) {
      data = data.filter((r) => Object.keys(keys).every((k) => String(r[k]) === String(keys[k])));
    }
    const q = req.query && req.query.SELECT;
    if (q && q.where) {
      const where = q.where;
      const and = Array.isArray(where) ? where : (where && where.and) || [];
      for (const cond of and) {
        if (cond && cond.ref && cond.val !== undefined) {
          const prop = Array.isArray(cond.ref) ? cond.ref[cond.ref.length - 1] : cond.ref;
          if (prop === 'course_ID') data = data.filter((r) => String(r.course_ID) === String(cond.val));
        }
      }
    }
    if (hasKeys && data.length === 1) return data[0];
    return data;
  }

  srv.on('READ', Programmes, (req) => handleRead('Programmes', req));
  srv.on('READ', Lecturers, (req) => handleRead('Lecturers', req));
  srv.on('READ', Venues, (req) => handleRead('Venues', req));
  srv.on('READ', Courses, (req) => handleRead('Courses', req));

  srv.on('READ', CourseSections, async (req) => {
    let data = await handleRead('CourseSections', req);
    return data;
  });

  srv.on('READ', Prerequisites, (req) => handleRead('Prerequisites', req));

  // ---------- Courses: CREATE, UPDATE ----------
  srv.on('CREATE', Courses, async (req) => {
    const d = req.data;
    const code = (d.courseCode || '').trim();
    if (!code) throw new Error('Course code is required.');
    const existing = store.Courses.find((c) => String(c.courseCode).toLowerCase() === code.toLowerCase());
    if (existing) throw new Error(`Course code "${code}" already exists.`);
    const rec = {
      ID: nextId('Courses'),
      courseCode: code,
      courseName: (d.courseName || '').trim() || '-',
      creditHours: Number(d.creditHours) || 0,
      programme: (d.programme || '').trim() || '-',
      year: parseInt(d.year, 10) || 1
    };
    store.Courses.push(rec);
    return rec;
  });

  srv.on('UPDATE', Courses, async (req) => {
    const keys = getKeyValues(req);
    const id = keys.ID != null ? parseInt(keys.ID, 10) : null;
    const rec = store.Courses.find((c) => c.ID === id);
    if (!rec) throw new Error('Course not found.');
    const d = req.data;
    if (d.courseCode != null) rec.courseCode = String(d.courseCode).trim();
    if (d.courseName != null) rec.courseName = String(d.courseName).trim();
    if (d.creditHours != null) rec.creditHours = Number(d.creditHours);
    if (d.programme != null) rec.programme = String(d.programme).trim();
    if (d.year != null) rec.year = parseInt(d.year, 10);
    return rec;
  });

  // ---------- CourseSections: CREATE, UPDATE with timetable conflict validation ----------
  function validateSectionConflict(data, excludeId) {
    const day = (data.dayOfWeek || '').trim();
    const start = (data.startTime || '').trim();
    const end = (data.endTime || '').trim();
    const vid = data.venue_ID != null ? parseInt(data.venue_ID, 10) : null;
    const lid = data.lecturer_ID != null ? parseInt(data.lecturer_ID, 10) : null;
    if (!day || !start || !end) return;

    for (const s of store.CourseSections) {
      if (excludeId != null && s.ID === excludeId) continue;
      if (vid != null && s.venue_ID === vid && overlaps(day, start, end, s.dayOfWeek, s.startTime, s.endTime)) {
        throw new Error(`Venue conflict: another section uses this venue on ${day} ${s.startTime}-${s.endTime}.`);
      }
      if (lid != null && s.lecturer_ID === lid && overlaps(day, start, end, s.dayOfWeek, s.startTime, s.endTime)) {
        throw new Error(`Lecturer conflict: this lecturer teaches another section on ${day} ${s.startTime}-${s.endTime}.`);
      }
    }
  }

  srv.on('CREATE', CourseSections, async (req) => {
    const d = req.data;
    const courseId = d.course_ID != null ? parseInt(d.course_ID, 10) : null;
    if (courseId == null || !store.Courses.find((c) => c.ID === courseId)) throw new Error('Valid course is required.');
    validateSectionConflict(d, null);
    const rec = {
      ID: nextId('CourseSections'),
      course_ID: courseId,
      lecturer_ID: d.lecturer_ID != null ? parseInt(d.lecturer_ID, 10) : null,
      venue_ID: d.venue_ID != null ? parseInt(d.venue_ID, 10) : null,
      studentQuota: parseInt(d.studentQuota, 10) || 0,
      dayOfWeek: (d.dayOfWeek || '').trim() || null,
      startTime: (d.startTime || '').trim() || null,
      endTime: (d.endTime || '').trim() || null
    };
    store.CourseSections.push(rec);
    return rec;
  });

  srv.on('UPDATE', CourseSections, async (req) => {
    const keys = getKeyValues(req);
    const id = keys.ID != null ? parseInt(keys.ID, 10) : null;
    const rec = store.CourseSections.find((s) => s.ID === id);
    if (!rec) throw new Error('Section not found.');
    const d = { ...rec, ...req.data };
    validateSectionConflict(d, id);
    if (req.data.lecturer_ID != null) rec.lecturer_ID = parseInt(req.data.lecturer_ID, 10);
    if (req.data.venue_ID != null) rec.venue_ID = parseInt(req.data.venue_ID, 10);
    if (req.data.studentQuota != null) rec.studentQuota = parseInt(req.data.studentQuota, 10);
    if (req.data.dayOfWeek != null) rec.dayOfWeek = String(req.data.dayOfWeek).trim();
    if (req.data.startTime != null) rec.startTime = String(req.data.startTime).trim();
    if (req.data.endTime != null) rec.endTime = String(req.data.endTime).trim();
    return rec;
  });

  // ---------- Prerequisites: CREATE (basic: no self-reference) ----------
  srv.on('CREATE', Prerequisites, async (req) => {
    const d = req.data;
    const cid = d.course_ID != null ? parseInt(d.course_ID, 10) : null;
    const pid = d.prerequisiteCourse_ID != null ? parseInt(d.prerequisiteCourse_ID, 10) : null;
    if (cid == null || pid == null) throw new Error('Course and prerequisite course are required.');
    if (cid === pid) throw new Error('A course cannot be its own prerequisite.');
    if (!store.Courses.find((c) => c.ID === cid)) throw new Error('Course not found.');
    if (!store.Courses.find((c) => c.ID === pid)) throw new Error('Prerequisite course not found.');
    const exists = store.Prerequisites.some((p) => p.course_ID === cid && p.prerequisiteCourse_ID === pid);
    if (exists) throw new Error('This prerequisite is already defined.');
    const rec = { ID: nextId('Prerequisites'), course_ID: cid, prerequisiteCourse_ID: pid };
    store.Prerequisites.push(rec);
    return rec;
  });

  // ---------- DELETE for prototype (optional) ----------
  srv.on('DELETE', Courses, async (req) => {
    const id = parseInt(getKeyValues(req).ID, 10);
    const i = store.Courses.findIndex((c) => c.ID === id);
    if (i >= 0) store.Courses.splice(i, 1);
  });

  srv.on('DELETE', CourseSections, async (req) => {
    const id = parseInt(getKeyValues(req).ID, 10);
    const i = store.CourseSections.findIndex((s) => s.ID === id);
    if (i >= 0) store.CourseSections.splice(i, 1);
  });

  srv.on('DELETE', Prerequisites, async (req) => {
    const id = parseInt(getKeyValues(req).ID, 10);
    const i = store.Prerequisites.findIndex((p) => p.ID === id);
    if (i >= 0) store.Prerequisites.splice(i, 1);
  });
};
