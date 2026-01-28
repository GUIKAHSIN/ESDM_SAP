sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], (Controller, Filter, JSONModel, MessageBox, MessageToast) => {
    "use strict";

    return Controller.extend("admin.controller.CourseDetail", {

        onInit() {
            const v = new JSONModel({
                editMode: false,
                currentCourseId: null,
                sections: [],
                prereqs: [],
                lecturers: [],
                venues: [],
                courses: [],
                course: null
            });
            this.getView().setModel(v, "view");

            this.getRouter().getRoute("CourseDetail").attachPatternMatched(this._onRouteMatched, this);
            this._loadLookupsFromMainModel();
        },

        _onRouteMatched(oEv) {
            const args = oEv.getParameter("arguments") || {};
            const id = args.id;
            if (!id) return;
            const courseId = parseInt(id, 10);
            const m = this.getView().getModel(); // main JSON model
            const courses = m.getProperty("/Courses") || [];
            const course = courses.find((c) => c.ID === courseId) || null;

            this.getView().getModel("view").setProperty("/currentCourseId", courseId);
            this.getView().getModel("view").setProperty("/course", course);

            // bind page to selected course (view model)
            this.byId("courseDetailPage").bindElement({ path: "view>/course" });
            this._refreshDerivedLists(courseId);

            // if navigated from "Sections" button, jump to sections tab
            const tab = args.query && args.query.tab;
            if (tab) {
                const tabs = this.byId("detailTabs");
                if (tabs) tabs.setSelectedKey(tab);
            }
        },

        _loadLookupsFromMainModel() {
            const m = this.getView().getModel(); // main JSON model
            const v = this.getView().getModel("view");
            v.setProperty("/lecturers", m.getProperty("/Lecturers") || []);
            v.setProperty("/venues", m.getProperty("/Venues") || []);
            v.setProperty("/courses", m.getProperty("/Courses") || []);
        },

        _refreshDerivedLists(courseId) {
            const m = this.getView().getModel();
            const v = this.getView().getModel("view");
            const allSections = m.getProperty("/CourseSections") || [];
            const allPrereqs = m.getProperty("/Prerequisites") || [];
            v.setProperty("/sections", allSections.filter((s) => s.course_ID === courseId));
            v.setProperty("/prereqs", allPrereqs.filter((p) => p.course_ID === courseId));
            v.setProperty("/courses", m.getProperty("/Courses") || []);
        },

        onNavBack() {
            this.getRouter().navTo("CourseList");
        },

        onEditCourse() {
            this.getView().getModel("view").setProperty("/editMode", true);
        },

        onSaveCourse() {
            const v = this.getView().getModel("view");
            const course = v.getProperty("/course");
            if (!course) return;
            // data already edited in the bound object; ensure it is written back
            const m = this.getView().getModel();
            const courses = m.getProperty("/Courses") || [];
            const idx = courses.findIndex((c) => c.ID === course.ID);
            if (idx >= 0) courses[idx] = course;
            m.setProperty("/Courses", courses);
            v.setProperty("/editMode", false);
            MessageToast.show(this.getResourceBundle().getText("saved"));
        },

        onCancelEdit() {
            const v = this.getView().getModel("view");
            const cid = v.getProperty("/currentCourseId");
            // reload selected course from main model
            const m = this.getView().getModel();
            const courses = m.getProperty("/Courses") || [];
            v.setProperty("/course", courses.find((c) => c.ID === cid) || null);
            v.setProperty("/editMode", false);
        },

        onAddSection() {
            const v = this.getView().getModel("view");
            const cid = v.getProperty("/currentCourseId");
            if (cid == null) return;

            const lecturers = v.getProperty("/lecturers") || [];
            const venues = v.getProperty("/venues") || [];
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

            const sl = new sap.m.Select({ id: "addSec_lecturer", width: "100%" });
            lecturers.forEach((l) => sl.addItem(new sap.m.Item({ key: String(l.ID), text: l.name })));
            const sv = new sap.m.Select({ id: "addSec_venue", width: "100%" });
            venues.forEach((v) => sv.addItem(new sap.m.Item({ key: String(v.ID), text: v.name })));
            const sd = new sap.m.Select({ id: "addSec_day", width: "100%" });
            days.forEach((d) => sd.addItem(new sap.m.Item({ key: d, text: d })));

            const d = new sap.m.Dialog({
                title: this.getResourceBundle().getText("addSection"),
                contentWidth: "28rem",
                content: [
                    new sap.m.VBox({ items: [
                        new sap.m.Label({ text: this.getResourceBundle().getText("lecturer") }),
                        sl,
                        new sap.m.Label({ text: this.getResourceBundle().getText("venue") }),
                        sv,
                        new sap.m.Label({ text: this.getResourceBundle().getText("quota") }),
                        new sap.m.StepInput({ id: "addSec_quota", value: 40, min: 1, max: 200 }),
                        new sap.m.Label({ text: this.getResourceBundle().getText("day") }),
                        sd,
                        new sap.m.Label({ text: this.getResourceBundle().getText("startTime") }),
                        new sap.m.Input({ id: "addSec_start", value: "08:00", placeholder: "HH:MM" }),
                        new sap.m.Label({ text: this.getResourceBundle().getText("endTime") }),
                        new sap.m.Input({ id: "addSec_end", value: "09:30", placeholder: "HH:MM" })
                    ]})
                ],
                beginButton: new sap.m.Button({ text: this.getResourceBundle().getText("save"), type: "Emphasized", press: () => this._onSaveSection(d, cid) }),
                endButton: new sap.m.Button({ text: this.getResourceBundle().getText("cancel"), press: () => d.close() })
            });
            this.getView().addDependent(d);
            d.open();
        },

        _onSaveSection(d, courseId) {
            const m = this.getView().getModel(); // main JSON model
            const selL = this.byId("addSec_lecturer");
            const selV = this.byId("addSec_venue");
            const selD = this.byId("addSec_day");
            const quota = this.byId("addSec_quota");
            const start = this.byId("addSec_start");
            const end = this.byId("addSec_end");

            const lecturer_ID = selL ? parseInt(selL.getSelectedKey(), 10) : null;
            const venue_ID = selV ? parseInt(selV.getSelectedKey(), 10) : null;
            const dayOfWeek = selD ? selD.getSelectedKey() : "";
            const studentQuota = quota ? parseInt(quota.getValue(), 10) : 40;
            const startTime = (start && start.getValue()) || "08:00";
            const endTime = (end && end.getValue()) || "09:30";
            // conflict validation (simple)
            const all = m.getProperty("/CourseSections") || [];
            const overlaps = (s) => {
                if (s.dayOfWeek !== dayOfWeek) return false;
                const toMin = (t) => {
                    const [h, mm] = String(t || "0:0").split(":").map(Number);
                    return (h || 0) * 60 + (mm || 0);
                };
                const s1 = toMin(startTime), e1 = toMin(endTime);
                const s2 = toMin(s.startTime), e2 = toMin(s.endTime);
                return s1 < e2 && e1 > s2;
            };
            if (venue_ID != null && all.some((s) => s.venue_ID === venue_ID && overlaps(s))) {
                MessageBox.error("Venue conflict: same venue is already scheduled at that time.");
                return;
            }
            if (lecturer_ID != null && all.some((s) => s.lecturer_ID === lecturer_ID && overlaps(s))) {
                MessageBox.error("Lecturer conflict: same lecturer is already scheduled at that time.");
                return;
            }

            const nextId = (m.getProperty("/nextIds/CourseSections") || 10) + 1;
            m.setProperty("/nextIds/CourseSections", nextId);
            all.push({ ID: nextId, course_ID: courseId, lecturer_ID, venue_ID, studentQuota, dayOfWeek, startTime, endTime });
            m.setProperty("/CourseSections", all);

            d.close();
            this._refreshDerivedLists(courseId);
            MessageToast.show(this.getResourceBundle().getText("sectionAdded"));
        },

        onDeleteSection(oEv) {
            const ctx = oEv.getSource().getBindingContext("view");
            if (!ctx) return;
            const o = ctx.getObject();
            const cid = this.getView().getModel("view").getProperty("/currentCourseId");
            MessageBox.confirm(this.getResourceBundle().getText("confirmDeleteSection"), {
                onClose: (a) => {
                    if (a !== MessageBox.Action.OK) return;
                    const m = this.getView().getModel();
                    const all = m.getProperty("/CourseSections") || [];
                    m.setProperty("/CourseSections", all.filter((s) => s.ID !== o.ID));
                    this._refreshDerivedLists(cid);
                    MessageToast.show(this.getResourceBundle().getText("deleted"));
                }
            });
        },

        onAddPrereq() {
            const v = this.getView().getModel("view");
            const cid = v.getProperty("/currentCourseId");
            if (cid == null) return;
            const courses = (v.getProperty("/courses") || []).filter((c) => c.ID !== cid);
            const existing = (v.getProperty("/prereqs") || []).map((p) => p.prerequisiteCourse_ID);

            const sel = new sap.m.Select({ id: "addPrereq_sel", width: "100%" });
            courses.filter((c) => !existing.includes(c.ID)).forEach((c) => sel.addItem(new sap.m.Item({ key: String(c.ID), text: c.courseCode + " - " + (c.courseName || "") })));

            const d = new sap.m.Dialog({
                title: this.getResourceBundle().getText("addPrereq"),
                contentWidth: "28rem",
                content: [ new sap.m.Label({ text: this.getResourceBundle().getText("prerequisiteCourse") }), sel ],
                beginButton: new sap.m.Button({ text: this.getResourceBundle().getText("save"), type: "Emphasized", press: () => this._onSavePrereq(d, cid) }),
                endButton: new sap.m.Button({ text: this.getResourceBundle().getText("cancel"), press: () => d.close() })
            });
            this.getView().addDependent(d);
            d.open();
        },

        _onSavePrereq(d, courseId) {
            const sel = this.byId("addPrereq_sel");
            const pid = sel ? parseInt(sel.getSelectedKey(), 10) : null;
            if (pid == null) { MessageBox.alert(this.getResourceBundle().getText("selectPrereq")); return; }
            if (pid === courseId) { MessageBox.error("A course cannot be its own prerequisite."); return; }
            const m = this.getView().getModel();
            const all = m.getProperty("/Prerequisites") || [];
            const exists = all.some((p) => p.course_ID === courseId && p.prerequisiteCourse_ID === pid);
            if (exists) { MessageBox.error("This prerequisite is already defined."); return; }
            const nextId = (m.getProperty("/nextIds/Prerequisites") || 10) + 1;
            m.setProperty("/nextIds/Prerequisites", nextId);
            all.push({ ID: nextId, course_ID: courseId, prerequisiteCourse_ID: pid });
            m.setProperty("/Prerequisites", all);
            d.close();
            this._refreshDerivedLists(courseId);
            MessageToast.show(this.getResourceBundle().getText("prereqAdded"));
        },

        onDeletePrereq(oEv) {
            const ctx = oEv.getSource().getBindingContext("view");
            if (!ctx) return;
            const o = ctx.getObject();
            const cid = this.getView().getModel("view").getProperty("/currentCourseId");
            MessageBox.confirm(this.getResourceBundle().getText("confirmDeletePrereq"), {
                onClose: (a) => {
                    if (a !== MessageBox.Action.OK) return;
                    const m = this.getView().getModel();
                    const all = m.getProperty("/Prerequisites") || [];
                    m.setProperty("/Prerequisites", all.filter((p) => p.ID !== o.ID));
                    this._refreshDerivedLists(cid);
                    MessageToast.show(this.getResourceBundle().getText("deleted"));
                }
            });
        },

        onTabSelect() {},

        formatLecturer(id) {
            const a = (this.getView().getModel("view") && this.getView().getModel("view").getProperty("/lecturers")) || [];
            const o = a.find((x) => x.ID == id);
            return o ? o.name : (id != null ? String(id) : "-");
        },
        formatVenue(id) {
            const a = (this.getView().getModel("view") && this.getView().getModel("view").getProperty("/venues")) || [];
            const o = a.find((x) => x.ID == id);
            return o ? o.name : (id != null ? String(id) : "-");
        },
        formatCourse(id) {
            const a = (this.getView().getModel("view") && this.getView().getModel("view").getProperty("/courses")) || [];
            const o = a.find((x) => x.ID == id);
            return o ? (o.courseCode + " - " + (o.courseName || "")) : (id != null ? String(id) : "-");
        },
        formatSectionId(id) {
            return id != null ? (this.getResourceBundle().getText("section") + " " + id) : "-";
        },

        getRouter() { return this.getOwnerComponent().getRouter(); },
        getResourceBundle() { return this.getOwnerComponent().getModel("i18n").getResourceBundle(); }
    });
});
