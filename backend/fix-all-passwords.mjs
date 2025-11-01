import bcrypt from 'bcryptjs';

const passwords = {
    admin: 'admin123',
    trainer: 'trainer123',
    member: 'member123'
};

for (const [role, password] of Object.entries(passwords)) {
    const hash = bcrypt.hashSync(password, 10);
    console.log(`\n${role.toUpperCase()} password: ${password}`);
    console.log(`Hash: ${hash}`);
}
