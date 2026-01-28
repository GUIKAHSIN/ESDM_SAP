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
                courses: []
            });
            this.getView().setModel(v, "view");

            this.getRouter().getRoute("CourseDetail").attachPatternMatched(this._onRouteMatched, this);
            this._loadLookups();
        },

        _onRouteMatched(oEv) {
            const id = oEv.getParameter("arguments").id;
            if (!id) return;
            const page = this.byId("courseDetailPage");
            page.bindElement({ path: "/Courses(" + id + ")", model: "" });
            this.getView().getModel("view").setProperty("/currentCourseId", parseInt(id, 10));
            this._loadSectionsAndPrereqs(parseInt(id, 10));
        },

        _loadLookups() {
            const m = this.getView().getModel();
            const v = this.getView().getModel("view");
            if (!m) return;
            const done = (key, a) => v.setProperty("/" + key, a || []);

            m.bindList("/Lecturers").requestContexts(0, 200).then((a) => done("lecturers", (a || []).map((c) => c.getObject())));
            m.bindList("/Venues").requestContexts(0, 200).then((a) => done("venues", (a || []).map((c) => c.getObject())));
            m.bindList("/Courses").requestContexts(0, 500).then((a) => done("courses", (a || []).map((c) => c.getObject())));
        },

        _loadSectionsAndPrereqs(courseId) {
            const m = this.getView().getModel();
            const v = this.getView().getModel("view");
            const f = new Filter("course_ID", "EQ", courseId);

            m.bindList("/CourseSections", null, [], [f]).requestContexts(0, 200)
                .then((a) => v.setProperty("/sections", (a || []).map((c) => c.getObject())));
            m.bindList("/Prerequisites", null, [], [f]).requestContexts(0, 200)
                .then((a) => v.setProperty("/prereqs", (a || []).map((c) => c.getObject())));
        },

        onNavBack() {
            this.getRouter().navTo("CourseList");
        },

        onEditCourse() {
            this.getView().getModel("view").setProperty("/editMode", true);
        },

        onSaveCourse() {
            const m = this.getView().getModel();
            m.submitBatch().then(() => {
                this.getView().getModel("view").setProperty("/editMode", false);
                MessageToast.show(this.getResourceBundle().getText("saved"));
            }).catch((e) => {
                MessageBox.error((e.cause && e.cause.message) || (e.message) || String(e));
            });
        },

        onCancelEdit() {
            const ctx = this.byId("courseDetailPage").getBindingContext();
            if (ctx) ctx.requestRefresh();
            this.getView().getModel("view").setProperty("/editMode", false);
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
            const m = this.getView().getModel();
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

            const ctx = m.createEntry("/CourseSections", {
                course_ID: courseId,
                lecturer_ID, venue_ID, studentQuota, dayOfWeek, startTime, endTime
            });
            m.submitBatch().then(() => {
                d.close();
                this._loadSectionsAndPrereqs(courseId);
                MessageToast.show(this.getResourceBundle().getText("sectionAdded"));
            }).catch((e) => {
                MessageBox.error((e.cause && e.cause.message) || (e.message) || String(e));
            });
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
                    const path = "/CourseSections(" + o.ID + ")";
                    const binding = m.bindContext(path);
                    const ctx = binding.getBoundContext ? binding.getBoundContext() : null;
                    if (ctx && typeof ctx.delete === "function") {
                        ctx.delete();
                        m.submitBatch().then(() => {
                            this._loadSectionsAndPrereqs(cid);
                            MessageToast.show(this.getResourceBundle().getText("deleted"));
                        }).catch((e) => MessageBox.error((e && e.message) || String(e)));
                    } else {
                        MessageBox.error(this.getResourceBundle().getText("deleteNotSupported"));
                    }
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
            const m = this.getView().getModel();
            m.createEntry("/Prerequisites", { course_ID: courseId, prerequisiteCourse_ID: pid });
            m.submitBatch().then(() => {
                d.close();
                this._loadSectionsAndPrereqs(courseId);
                MessageToast.show(this.getResourceBundle().getText("prereqAdded"));
            }).catch((e) => MessageBox.error((e.cause && e.cause.message) || (e.message) || String(e)));
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
                    const path = "/Prerequisites(" + o.ID + ")";
                    const binding = m.bindContext(path);
                    const ctx = binding.getBoundContext ? binding.getBoundContext() : null;
                    if (ctx && typeof ctx.delete === "function") {
                        ctx.delete();
                        m.submitBatch().then(() => {
                            this._loadSectionsAndPrereqs(cid);
                            MessageToast.show(this.getResourceBundle().getText("deleted"));
                        }).catch((e) => MessageBox.error((e && e.message) || String(e)));
                    } else {
                        MessageBox.error(this.getResourceBundle().getText("deleteNotSupported"));
                    }
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
