import { DatabaseModel } from "./DatabaseModel.mjs";

export class SessionModel extends DatabaseModel {
  constructor(id, activity_id, location_id, trainer_id, date, start_time, end_time,
    max_capacity, current_bookings, special_notes, status) {
    super();
    this.id = id;
    this.activity_id = activity_id;
    this.location_id = location_id;
    this.trainer_id = trainer_id;
    this.date = date;
    this.start_time = start_time;
    this.end_time = end_time;
    this.max_capacity = max_capacity;
    this.current_bookings = current_bookings;
    this.special_notes = special_notes;
    this.status = status;
  }

  static tableToModel(row) {
    const r = row.sessions;
    return new SessionModel(
      r.id, r.activity_id, r.location_id, r.trainer_id, r.date, r.start_time, r.end_time,
      r.max_capacity, r.current_bookings, r.special_notes, r.status
    );
  }

  static async getAll() {
    return this.query("SELECT * FROM sessions ORDER BY date, start_time")
      .then(rows => rows.map(row => this.tableToModel(row)));
  }

  static async getById(id) {
    return this.query("SELECT * FROM sessions WHERE id=?", [id]).then(rows =>
      rows.length ? this.tableToModel(rows[0]) : Promise.reject("not found")
    );
  }

  static formatTimeForDB(timeString) {

    if (!timeString) return null;


    if (timeString.length === 8) return timeString;

    if (timeString.length === 5) return `${timeString}:00`;

    return timeString;
  }

  static async create(s) {
    return this.query(
      `INSERT INTO sessions
       (activity_id, location_id, trainer_id, date, start_time, end_time, max_capacity, 
       current_bookings, special_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.activity_id,
        s.location_id,
        s.trainer_id,
        s.date,
        this.formatTimeForDB(s.start_time),
        this.formatTimeForDB(s.end_time),
        s.max_capacity,
        s.current_bookings ?? 0,
        s.special_notes,
        s.status ?? "scheduled"
      ]
    );
  }

  static async update(s) {
    return this.query(
      `UPDATE sessions
       SET activity_id=?, location_id=?, trainer_id=?, date=?, start_time=?, end_time=?,
           max_capacity=?, current_bookings=?, special_notes=?, status=?
       WHERE id=?`,
      [
        s.activity_id,
        s.location_id,
        s.trainer_id,
        s.date,
        this.formatTimeForDB(s.start_time),
        this.formatTimeForDB(s.end_time),
        s.max_capacity,
        s.current_bookings,
        s.special_notes,
        s.status,
        s.id
      ]
    );
  }

  static async delete(id) {
    return this.query("DELETE FROM sessions WHERE id=?", [id]).then(r => r.affectedRows ?
      r : Promise.reject("not found"));
  }


  static async getByDateWithDetails(date) {
    const rows = await this.query(`
        SELECT 
            s.id, s.activity_id, s.location_id, s.trainer_id,
            s.date, s.start_time, s.end_time, s.max_capacity, 
            s.current_bookings, s.special_notes, s.status,
            a.name as activity_name,
            l.name as location_name,
            CONCAT(u.first_name, ' ', u.last_name) as trainer_name,
            (s.max_capacity - s.current_bookings) as available_spots
        FROM sessions s
        JOIN activities a ON s.activity_id = a.id
        JOIN locations l ON s.location_id = l.id
        JOIN users u ON s.trainer_id = u.id
        WHERE s.date = ? AND s.status = 'scheduled'
        ORDER BY s.start_time
    `, [date]);

    console.log('=== SESSION QUERY DEBUG ===');
    console.log('Date queried:', date);
    console.log('Rows returned:', rows.length);
    if (rows.length > 0) {
      console.log('First row structure:', Object.keys(rows[0]));
      console.log('First row data:', rows[0]);
      console.log('Activity name path test:', rows[0].a?.activity_name, rows[0].a?.name);
      console.log('Location name path test:', rows[0].l?.location_name, rows[0].l?.name);
    }


    return rows.map(row => ({
      id: row.s.id,
      activity_id: row.s.activity_id,
      location_id: row.s.location_id,
      trainer_id: row.s.trainer_id,
      date: row.s.date,
      start_time: row.s.start_time,
      end_time: row.s.end_time,
      max_capacity: row.s.max_capacity,
      current_bookings: row.s.current_bookings,
      special_notes: row.s.special_notes,
      status: row.s.status,

      activity_name: row.a.activity_name,
      location_name: row.l.location_name,
      trainer_name: row[''].trainer_name,
      available_spots: row[''].available_spots
    }));
  }

  static async getAllWithDetails() {
    const rows = await this.query(`
        SELECT 
            s.id, s.activity_id, s.location_id, s.trainer_id,
            s.date, s.start_time, s.end_time, s.max_capacity,
            s.current_bookings, s.special_notes, s.status,
            a.name as activity_name,
            l.name as location_name,
            CONCAT(u.first_name, ' ', u.last_name) as trainer_name
        FROM sessions s
        JOIN activities a ON s.activity_id = a.id
        JOIN locations l ON s.location_id = l.id
        JOIN users u ON s.trainer_id = u.id
        ORDER BY s.date, s.start_time
    `);

    return rows.map(row => ({
      id: row.s.id,
      activity_id: row.s.activity_id,
      location_id: row.s.location_id,
      trainer_id: row.s.trainer_id,
      date: row.s.date,
      start_time: row.s.start_time,
      end_time: row.s.end_time,
      max_capacity: row.s.max_capacity,
      current_bookings: row.s.current_bookings,
      special_notes: row.s.special_notes,
      status: row.s.status,
      activity_name: row.a.activity_name,
      location_name: row.l.location_name,
      trainer_name: row[''].trainer_name
    }));
  }
}