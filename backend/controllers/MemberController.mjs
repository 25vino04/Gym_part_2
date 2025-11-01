import express from "express";
import { SessionModel } from "../models/SessionModel.mjs";
import { BookingModel } from "../models/BookingModel.mjs";
import { UserModel } from "../models/UserModel.mjs";

export class MemberController {
    static routes = express.Router();

    static {
        this.routes.get("/member-dashboard", this.viewDashboard);
        this.routes.post("/cancel-booking/:id", this.cancelBooking);
    }

    static async cancelBooking(req, res) {
        if (!req.session.user || req.session.user.role !== 'member') {
            return res.redirect("/login");
        }

        const bookingId = req.params.id;
        const memberId = req.session.user.id;

        try {
            const booking = await BookingModel.getById(bookingId);

            if (booking.member_id !== memberId) {
                return res.status(403).send("Access denied");
            }

            await BookingModel.update({
                id: bookingId,
                session_id: booking.session_id,
                member_id: booking.member_id,
                status: 'cancelled',
                cancellation_reason: 'Cancelled by member',
                cancelled_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                checked_in: booking.checked_in,
                check_in_time: booking.check_in_time,
                notes: booking.notes
            });

            await SessionModel.query(
                "UPDATE sessions SET current_bookings = current_bookings - 1 WHERE id = ?",
                [booking.session_id]
            );

            res.redirect("/member-dashboard?success=booking_cancelled");
        } catch (error) {
            console.error("Cancel booking error:", error);
            res.redirect("/member-dashboard?error=cancel_failed");
        }
    }

    static async viewDashboard(req, res) {
        if (!req.session.user) {
            return res.redirect("/login");
        }

        try {
            const memberId = req.session.user.id;
            const user = await UserModel.getById(memberId);


            const bookingsData = await BookingModel.query(`
                SELECT 
                    b.id,
                    b.session_id,
                    b.status,
                    s.date,
                    s.start_time,
                    s.end_time,
                    a.name as activity_name,
                    l.name as location_name,
                    CONCAT(u.first_name, ' ', u.last_name) as trainer_name
                FROM bookings b
                JOIN sessions s ON b.session_id = s.id
                JOIN activities a ON s.activity_id = a.id
                JOIN locations l ON s.location_id = l.id
                JOIN users u ON s.trainer_id = u.id
                WHERE b.member_id = ?
                ORDER BY s.date, s.start_time
            `, [memberId]);

            console.log('=== MEMBER DASHBOARD DEBUG ===');
            if (bookingsData.length > 0) {
                console.log('First booking structure:', Object.keys(bookingsData[0]));
                console.log('First booking data:', bookingsData[0]);
            }


            const bookings = bookingsData.map(row => ({
                id: row.b.id,
                session_id: row.b.session_id,
                status: row.b.status,
                date: row.s.date,
                start_time: row.s.start_time,
                end_time: row.s.end_time,
                activity_name: row.a.activity_name,
                location_name: row.l.location_name,
                trainer_name: row[''].trainer_name
            }));

            res.render("member_dashboard", {
                user: req.session.user,
                member: user,
                bookings,
                success: req.query.success || null
            });
        } catch (error) {
            console.error("Member dashboard error:", error);
            res.status(500).send("Error loading dashboard");
        }
    }
}