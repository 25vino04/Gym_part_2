import express from "express";
import { BookingModel } from "../models/BookingModel.mjs";
import { SessionModel } from "../models/SessionModel.mjs";
import { UserModel } from "../models/UserModel.mjs";

export class BookingController {
    static routes = express.Router();

    static {
        this.routes.get("/", this.viewAdmin);
        this.routes.get("/:id", this.viewAdmin);
        this.routes.post("/", this.handleAdmin);
        this.routes.post("/:id", this.handleAdmin);

        this.routes.post("/:id/delete", this.handleDelete);
    }

    static async viewAdmin(req, res) {
        try {
            const selectedId = req.params.id;

            const filterStatus = req.query.status || '';
            const filterMember = req.query.member || '';
            const filterSessionDate = req.query.sessionDate || '';
            const filterBookingDate = req.query.bookingDate || '';

            let [bookings, sessions, members] = await Promise.all([
                BookingModel.getAllWithDetails(),
                SessionModel.getAllWithDetails(),
                UserModel.getAll().then(us => us.filter(u => u.role === "member"))
            ]);


            if (filterStatus) {
                bookings = bookings.filter(b => b.status === filterStatus);
            }

            if (filterMember) {
                bookings = bookings.filter(b => b.member_id == filterMember);
            }

            if (filterSessionDate) {
                bookings = bookings.filter(b => {
                    if (!b.session_date) return false;
                    const sessionDate = new Date(b.session_date).toISOString().split('T')[0];
                    return sessionDate === filterSessionDate;
                });
            }

            if (filterBookingDate) {
                bookings = bookings.filter(b => {
                    const bDate = b.booking_date ? new Date(b.booking_date).toISOString().split('T')[0] :
                        new Date(b.created_at).toISOString().split('T')[0];
                    return bDate === filterBookingDate;
                });
            }

            console.log('=== BOOKINGS DEBUG ===');
            console.log('Total bookings after filters:', bookings.length);

            const selectedBooking =
                bookings.find(b => b.id == selectedId) ??
                {
                    id: null, session_id: "", member_id: "", status: "confirmed",
                    cancellation_reason: null, cancelled_at: null, checked_in: false,
                    check_in_time: null, notes: null
                };

            const success = req.query.success || null;
            const error = req.query.error || null;

            res.render("bookings_admin.ejs", {
                bookings,
                selectedBooking,
                sessions,
                members,
                success,
                error,
                filterStatus,
                filterMember,
                filterSessionDate,
                filterBookingDate
            });
        } catch (e) {
            console.error(e);
            res.status(500).render("status.ejs", { status: "Error", message: "Cannot load bookings." });
        }
    }

    static async handleAdmin(req, res) {
        const id = req.params.id;
        const f = req.body;
        const action = f.action;

        const dto = {
            id,
            session_id: Number(f.session_id),
            member_id: Number(f.member_id),
            status: f.status || "confirmed",
            cancellation_reason: f.cancellation_reason || null,
            cancelled_at: f.cancelled_at || null,
            checked_in: !!f.checked_in,
            check_in_time: f.check_in_time || null,
            notes: f.notes || null
        };

        try {
            if (action === "create") {
                await BookingModel.create(dto);
                return res.redirect("/bookings?success=booking_created");
            }
            if (action === "update") {
                await BookingModel.update(dto);
                return res.redirect("/bookings?success=booking_updated");
            }
            if (action === "delete") {
                await BookingModel.delete(id);
                return res.redirect("/bookings?success=booking_deleted");
            }
            return res.status(400).render("status.ejs", { status: "Invalid action", message: "Unsupported action." });
        } catch (e) {
            console.error(e);
            res.status(500).render("status.ejs", { status: "DB error", message: "You cannot double book a session." });
        }
    }


    static async handleDelete(req, res) {
        const id = req.params.id;
        console.log(' DELETE REQUEST received for booking ID:', id);
        try {
            const result = await BookingModel.delete(id);
            console.log('✅ Delete successful:', result);
            res.redirect("/bookings?success=booking_deleted");
        } catch (e) {
            console.error('❌ Delete error:', e);
            res.redirect("/bookings?error=delete_failed");
        }
    }
}