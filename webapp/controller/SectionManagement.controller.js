sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], (Controller, JSONModel, MessageBox, MessageToast) => {
    "use strict";

    function toMinutes(t) {
        const [h, m] = String(t || "0:0").split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
    }

    function overlaps(aStart, aEnd, bStart, bEnd) {
        const s1 = toMinutes(aStart), e1 = toMinutes(aEnd);
        const s2 = toMinutes(bStart), e2 = toMinutes(bEnd);
        return s1 < e2 && e1 > s2;
    }

    return Controller.extend("admin.controller.SectionManagement", {
        onInit() {
            const vm = new JSONModel({
                courseId: null,
                courseTitle: "",
                showAddForm: false,
                editingSectionId: null,
                lecturers: [],
                venues: [],
                sections: [],
                draft: {
                    sectionCode: "",
                    lecturer_ID: "",
                    venue_ID: "",
                    dayOfWeek: "",
                    timeRange: "",
                    studentQuota: 30
                }
            });
            this.getView().setModel(vm, "view");

            this.getRouter().getRoute("SectionManagement").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched(ev) {
            const id = parseInt(ev.getParameter("arguments").id, 10);
            const m = this.getView().getModel(); // main JSON model
            const v = this.getView().getModel("view");

            const courses = m.getProperty("/Courses") || [];
            const course = courses.find((c) => c.ID === id);

            v.setProperty("/courseId", id);
            v.setProperty("/courseTitle", course ? (course.courseCode + " - " + (course.courseName || "")) : "");
            const rb = this.getResourceBundle();
            v.setProperty("/lecturers", [{ ID: "", name: rb.getText("selectLecturer") }].concat(m.getProperty("/Lecturers") || []));
            v.setProperty("/venues", [{ ID: "", name: rb.getText("selectVenue") }].concat(m.getProperty("/Venues") || []));

            this._refreshSections();
            this._resetDraft();
            v.setProperty("/showAddForm", false);
            v.setProperty("/editingSectionId", null);
        },

        _refreshSections() {
            const m = this.getView().getModel();
            const v = this.getView().getModel("view");
            const cid = v.getProperty("/courseId");
            const all = m.getProperty("/CourseSections") || [];
            v.setProperty("/sections", all.filter((s) => s.course_ID === cid));
        },

        _resetDraft() {
            this.getView().getModel("view").setProperty("/draft", {
                sectionCode: "",
                lecturer_ID: "",
                venue_ID: "",
                dayOfWeek: "",
                timeRange: "",
                studentQuota: 30
            });
        },

        onBackToCourseList() {
            this.getRouter().navTo("CourseList");
        },

        onToggleAddForm() {
            const v = this.getView().getModel("view");
            v.setProperty("/showAddForm", !v.getProperty("/showAddForm"));
        },

        onCancelAdd() {
            this._resetDraft();
            this.getView().getModel("view").setProperty("/showAddForm", false);
            this.getView().getModel("view").setProperty("/editingSectionId", null);
        },

        onEditSection(ev) {
            const rowCtx = ev.getSource().getParent().getParent().getBindingContext("view");
            if (!rowCtx) return;
            const row = rowCtx.getObject();
            const v = this.getView().getModel("view");
            v.setProperty("/editingSectionId", row.ID);
            v.setProperty("/showAddForm", true);
            v.setProperty("/draft", {
                sectionCode: row.sectionCode || "",
                lecturer_ID: String(row.lecturer_ID || ""),
                venue_ID: String(row.venue_ID || ""),
                dayOfWeek: row.dayOfWeek || "",
                timeRange: (row.startTime && row.endTime) ? `${row.startTime}-${row.endTime}` : "",
                studentQuota: row.studentQuota || 30
            });
        },

        onSaveSection() {
            const m = this.getView().getModel(); // main JSON model
            const v = this.getView().getModel("view");
            const cid = v.getProperty("/courseId");
            const d = v.getProperty("/draft");
            const editingId = v.getProperty("/editingSectionId");

            const sectionCode = String(d.sectionCode || "").trim();
            const lecturer_ID = parseInt(d.lecturer_ID, 10);
            const venue_ID = parseInt(d.venue_ID, 10);
            const dayOfWeek = String(d.dayOfWeek || "").trim();
            const studentQuota = parseInt(d.studentQuota, 10) || 0;
            const timeRange = String(d.timeRange || "").trim();

            if (!sectionCode || !dayOfWeek || !timeRange || !lecturer_ID || !venue_ID) {
                MessageBox.error("Please fill in all required fields.");
                return;
            }
            const parts = timeRange.split("-").map((x) => x.trim());
            if (parts.length !== 2) {
                MessageBox.error("Time must be in format HH:MM-HH:MM (e.g. 08:00-10:00).");
                return;
            }
            const [startTime, endTime] = parts;
            if (toMinutes(endTime) <= toMinutes(startTime)) {
                MessageBox.error("End time must be after start time.");
                return;
            }

            // Real-time conflict validation (venue + lecturer)
            const allSections = m.getProperty("/CourseSections") || [];
            const conflicts = allSections.filter((s) =>
                (!editingId || s.ID !== editingId) &&
                s.dayOfWeek === dayOfWeek &&
                overlaps(startTime, endTime, s.startTime, s.endTime) &&
                (s.venue_ID === venue_ID || s.lecturer_ID === lecturer_ID)
            );
            const venueConflict = conflicts.find((s) => s.venue_ID === venue_ID);
            if (venueConflict) {
                MessageBox.error(`Venue conflict: venue already used on ${dayOfWeek} ${venueConflict.startTime}-${venueConflict.endTime}.`);
                return;
            }
            const lecturerConflict = conflicts.find((s) => s.lecturer_ID === lecturer_ID);
            if (lecturerConflict) {
                MessageBox.error(`Lecturer conflict: lecturer already scheduled on ${dayOfWeek} ${lecturerConflict.startTime}-${lecturerConflict.endTime}.`);
                return;
            }

            if (editingId) {
                const idx = allSections.findIndex((s) => s.ID === editingId);
                if (idx >= 0) {
                    allSections[idx] = {
                        ...allSections[idx],
                        sectionCode,
                        lecturer_ID,
                        venue_ID,
                        studentQuota,
                        dayOfWeek,
                        startTime,
                        endTime
                    };
                }
            } else {
                const nextId = (m.getProperty("/nextIds/CourseSections") || 10) + 1;
                m.setProperty("/nextIds/CourseSections", nextId);
                allSections.push({
                    ID: nextId,
                    course_ID: cid,
                    sectionCode,
                    lecturer_ID,
                    venue_ID,
                    studentQuota,
                    enrolled: 0,
                    dayOfWeek,
                    startTime,
                    endTime
                });
            }
            m.setProperty("/CourseSections", allSections);

            this._refreshSections();
            this._resetDraft();
            v.setProperty("/showAddForm", false);
            v.setProperty("/editingSectionId", null);
            MessageToast.show(this.getResourceBundle().getText("sectionAdded"));
        },

        onDeleteSection(ev) {
            const rowCtx = ev.getSource().getParent().getParent().getBindingContext("view");
            if (!rowCtx) return;
            const row = rowCtx.getObject();
            const cid = this.getView().getModel("view").getProperty("/courseId");

            MessageBox.confirm(this.getResourceBundle().getText("confirmDeleteSection"), {
                onClose: (a) => {
                    if (a !== MessageBox.Action.OK) return;
                    const m = this.getView().getModel();
                    const all = m.getProperty("/CourseSections") || [];
                    m.setProperty("/CourseSections", all.filter((s) => s.ID !== row.ID));
                    this._refreshSections();
                    MessageToast.show(this.getResourceBundle().getText("deleted"));
                }
            });
        },

        formatLecturer(id) {
            const a = this.getView().getModel("view").getProperty("/lecturers") || [];
            const o = a.find((x) => x.ID == id);
            return o ? o.name : (id != null ? String(id) : "-");
        },
        formatVenue(id) {
            const a = this.getView().getModel("view").getProperty("/venues") || [];
            const o = a.find((x) => x.ID == id);
            return o ? o.name : (id != null ? String(id) : "-");
        },
        formatSectionCode(code) {
            if (code) return code;
            return "-";
        },

        getRouter() { return this.getOwnerComponent().getRouter(); },
        getResourceBundle() { return this.getOwnerComponent().getModel("i18n").getResourceBundle(); }
    });
});

