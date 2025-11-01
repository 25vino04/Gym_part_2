import mysql from "mysql2/promise";

export class DatabaseModel {
    static connection

    static {
        this.connection = mysql.createPool({
            host: "localhost",
            user: "gym",
            password: "12345678Qw",
            database: "gym",
            nestTables: true,
            timezone: 'local',
            dateStrings: true,
        })
    }

    static query(sql, values) {
        return this.connection.query(sql, values).then(([result]) => result);
    }

    static toMySqlDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`; // YYYY-MM-DD

    }
}


