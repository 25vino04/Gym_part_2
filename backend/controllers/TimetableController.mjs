import express from "express";
import { SessionModel } from "../models/SessionModel.mjs";
import { BookingModel } from "../models/BookingModel.mjs";

export class TimetableController {
    static routes = express.Router();

    static {
        this.routes.get("/timetable", this.viewTimetable);
        this.routes.post("/timetable/book", this.bookSession);
    }

    static async viewTimetable(req, res) {
        try {
            const weekOffset = parseInt(req.query.week) || 0;

            const todayResult = await SessionModel.query("SELECT CURDATE() as today");
            const todayStr = todayResult[0][''].today;


            const [year, month, day] = todayStr.split('-').map(Number);
            const today = new Date(year, month - 1, day);


            const dayOfWeek = today.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

            const startOfWeek = new Date(year, month - 1, day + diff + (weekOffset * 7));

            let bookedSessionIds = [];
            if (req.session.user && req.session.user.role === "member") {
                const userBookings = await BookingModel.getByMember(req.session.user.id);
                bookedSessionIds = userBookings.map((b) => b.session_id);
            }

            const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const days = [];

            for (let i = 0; i < 7; i++) {

                const currentDate = new Date(
                    startOfWeek.getFullYear(),
                    startOfWeek.getMonth(),
                    startOfWeek.getDate() + i
                );


                const dateYear = currentDate.getFullYear();
                const dateMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
                const dateDay = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${dateYear}-${dateMonth}-${dateDay}`;

                const sessions = await SessionModel.getByDateWithDetails(dateStr);

                if (bookedSessionIds.length) {
                    sessions.forEach((s) => { s.is_booked = bookedSessionIds.includes(s.id); });
                }

                days.push({
                    name: dayNames[i],
                    date: currentDate.toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        timeZone: 'Australia/Brisbane'
                    }),
                    fullDate: dateStr,
                    sessions
                });
            }

            const weekStart = days[0]?.date || "";
            const weekEnd = days[6]?.date || "";


            console.log('=== TIMETABLE DEBUG ===');
            console.log('Week offset:', weekOffset);
            console.log('Today from DB:', todayStr);
            console.log('Start of week:', startOfWeek.toISOString().split('T')[0]);
            console.log('Days generated:', days.map(d => ({ name: d.name, fullDate: d.fullDate, sessions: d.sessions.length })));

            res.render("timetable", {
                days,
                weekStart,
                weekEnd,
                weekOffset,
                success: req.query.success || null,
                error: req.query.error || null,
                user: req.session.user || null,
            });
        } catch (error) {
            console.error("Timetable error:", error);
            res.status(500).render("timetable", {
                days: [],
                weekStart: "",
                weekEnd: "",
                weekOffset: 0,
                success: null,
                error: "Failed to load timetable",
                user: req.session.user || null,
            });
        }
    }

    static async bookSession(req, res) {
        if (!req.session.user || req.session.user.role !== "member") {
            return res.redirect("/login");
        }

        const sessionId = req.body.session_id;

        try {
            const session = await SessionModel.getById(sessionId);
            if (!session) {
                return res.redirect("/timetable?error=session_not_found");
            }

            if (session.current_bookings >= session.max_capacity) {
                return res.redirect("/timetable?error=class_full");
            }

            const existingBookings = await BookingModel.getByMember(req.session.user.id);
            const alreadyBooked = existingBookings.some((b) => b.session_id == sessionId);
            if (alreadyBooked) {
                return res.redirect("/timetable?error=already_booked");
            }

            await BookingModel.create({
                session_id: sessionId,
                member_id: req.session.user.id,
                status: "confirmed",
                checked_in: false,
            });

            await SessionModel.query(
                "UPDATE sessions SET current_bookings = current_bookings + 1 WHERE id = ?",
                [sessionId]
            );

            return res.redirect("/timetable?success=booking_created");
        } catch (error) {
            console.error("Booking error:", error);
            return res.redirect("/timetable?error=booking_failed");
        }
    }
}